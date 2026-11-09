import mongoose from 'mongoose';
import { Agent } from '../models/Agent.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { logger } from '../utils/logger.js';

export async function createAgent(req, res, next) {
  try {
    const {
      name,
      language = 'English',
      voice = 'meera',
      first_message,
      agent_prompt,
      max_call,
      isActive = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Agent name is required',
      });
    }

    if (!first_message || !first_message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First message greeting is required',
      });
    }

    if (!agent_prompt || !agent_prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Agent prompt is required',
      });
    }

    const maxCallNum =
      max_call !== undefined && max_call !== '' && max_call !== null
        ? Number(max_call)
        : null;

    const createUrl = process.env.VISTARA_AGENT_CREATE_URL;
    const apiKey =
      process.env.VISTARA_API_KEY ||
      process.env.CUSTOM_AI_API_KEY;

    if (createUrl) {
      try {
        const vistaraPayload = {
          name: name.trim(),
          language: language.trim() || 'English',
          voice: voice || 'meera',
          first_message: first_message.trim(),
          agent_prompt: agent_prompt.trim(),
          system_instruction: agent_prompt.trim(),
          status: isActive !== false ? 'active' : 'paused',
        };

        if (maxCallNum !== null) {
          vistaraPayload.max_call_duration = maxCallNum;
        }

        const headers = {
          'Content-Type': 'application/json',
        };

        if (apiKey) {
          headers['x-api-key'] = apiKey;
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        logger.info({ createUrl }, 'Creating new agent via external Vistara AI API');

        const response = await fetch(createUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(vistaraPayload),
        });

        if (response.ok) {
          const externalData = await response.json();
          const createdAgent = externalData.agent || externalData.data || externalData;

          const normalizedAgent = {
            _id: createdAgent.id || createdAgent._id,
            id: createdAgent.id || createdAgent._id,
            name: createdAgent.name || name.trim(),
            language: createdAgent.language || language.trim() || 'English',
            voice: createdAgent.voice || voice || 'meera',
            first_message: createdAgent.first_message || first_message.trim(),
            agent_prompt:
              createdAgent.system_instruction ||
              createdAgent.agent_prompt ||
              agent_prompt.trim(),
            max_call:
              createdAgent.max_call_duration !== undefined
                ? createdAgent.max_call_duration
                : maxCallNum,
            isActive: createdAgent.status === 'active' || isActive !== false,
            status: createdAgent.status || 'active',
            raw: createdAgent,
          };

          // If active and MongoDB is connected, sync to StoreSettings
          if (normalizedAgent.isActive && mongoose.connection?.readyState === 1) {
            await StoreSettings.findOneAndUpdate(
              {},
              {
                $set: {
                  aiAgentName: normalizedAgent.name,
                  aiVoiceLanguage: normalizedAgent.language,
                  aiAgentGreeting: normalizedAgent.first_message,
                  aiAgentTone: `Voice: ${normalizedAgent.voice}`,
                },
              },
              { upsert: true }
            );
          }

          logger.info({ agentId: normalizedAgent._id, name: normalizedAgent.name }, 'New AI Voice Agent created on Vistara AI');

          return res.status(201).json({
            success: true,
            message: externalData.message || 'Agent created successfully on Vistara AI',
            agent: normalizedAgent,
          });
        }

        const errorText = await response.text();
        let errorMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.message || parsed.error || errorText;
        } catch {
          // Keep text
        }

        logger.error({ status: response.status, error: errorMsg }, 'Vistara agent creation failed');

        return res.status(response.status).json({
          success: false,
          message: errorMsg || 'Failed to create agent on Vistara AI',
        });
      } catch (externalErr) {
        logger.error({ error: externalErr.message }, 'Error reaching Vistara AI agent create service');
        return res.status(500).json({
          success: false,
          message: externalErr.message || 'Failed to reach Vistara AI agent creation service',
        });
      }
    }

    // Fallback: If VISTARA_AGENT_CREATE_URL is not set, create in local database
    const agent = await Agent.create({
      name: name.trim(),
      language: language.trim() || 'English',
      voice: voice || 'meera',
      first_message: first_message.trim(),
      agent_prompt: agent_prompt.trim(),
      max_call: maxCallNum,
      isActive: Boolean(isActive),
    });

    if (agent.isActive && mongoose.connection?.readyState === 1) {
      await StoreSettings.findOneAndUpdate(
        {},
        {
          $set: {
            aiAgentName: agent.name,
            aiVoiceLanguage: agent.language,
            aiAgentGreeting: agent.first_message,
            aiAgentTone: `Voice: ${agent.voice}`,
          },
        },
        { upsert: true }
      );
    }

    logger.info({ agentId: agent._id, name: agent.name }, 'New AI Voice Agent created in local database');

    return res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAgents(req, res, next) {
  try {
    const vistaraUrl =
      process.env.VISTARA_AGENT_lIST_URL ||
      process.env.VISTARA_AGENT_LIST_URL;
    const apiKey =
      process.env.VISTARA_API_KEY ||
      process.env.CUSTOM_AI_API_KEY;

    if (vistaraUrl) {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };

        if (apiKey) {
          headers['x-api-key'] = apiKey;

        }

        logger.info({ vistaraUrl }, 'Fetching agent list from external Vistara AI API');

        const response = await fetch(vistaraUrl, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const externalData = await response.json();
          const rawList = Array.isArray(externalData.data)
            ? externalData.data
            : Array.isArray(externalData.agents)
              ? externalData.agents
              : Array.isArray(externalData)
                ? externalData
                : [];

          // Normalize each agent object for seamless frontend compatibility
          const agents = rawList.map((item) => ({
            _id: item.id || item._id,
            id: item.id || item._id,
            name: item.name || 'AI Voice Agent',
            language: item.language || 'English',
            voice: item.voice || 'meera',
            first_message: item.first_message || '',
            agent_prompt: item.agent_prompt || item.system_prompt || item.prompt || '',
            max_call:
              item.max_call_duration !== undefined
                ? item.max_call_duration
                : item.max_call !== undefined
                  ? item.max_call
                  : null,
            isActive: item.status === 'active' || item.isActive !== false,
            status: item.status || (item.isActive ? 'active' : 'inactive'),
            raw: item,
          }));

          logger.info({ count: agents.length }, 'Successfully retrieved agents from external Vistara API');

          return res.status(200).json({
            success: true,
            agents,
            data: rawList,
            pagination: externalData.pagination || null,
          });
        }

        const errorText = await response.text();
        logger.warn(
          { status: response.status, errorText },
          'Vistara agent list API returned non-200, falling back to local database'
        );
      } catch (externalErr) {
        logger.warn(
          { error: externalErr.message },
          'Error requesting external Vistara agent list API, falling back to local database'
        );
      }
    }

    // Fallback or default to local Agent model
    const localAgents = await Agent.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      agents: localAgents,
      data: localAgents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAgent(req, res, next) {
  try {
    let agent = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      agent = await Agent.findById(req.params.id).lean();
    }
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    return res.status(200).json({
      success: true,
      agent,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAgent(req, res, next) {
  try {
    const {
      name,
      language,
      voice,
      first_message,
      agent_prompt,
      max_call,
      isActive,
    } = req.body;

    const updateBaseUrl = process.env.VISTARA_AGENT_UPDATE_URL;
    const apiKey =
      process.env.VISTARA_API_KEY ||
      process.env.CUSTOM_AI_API_KEY;

    if (updateBaseUrl) {
      try {
        const targetUrl = `${updateBaseUrl.replace(/\/+$/, '')}/${req.params.id}`;

        const vistaraPayload = {};
        if (name !== undefined) vistaraPayload.name = name.trim();
        if (language !== undefined) vistaraPayload.language = language.trim();
        if (voice !== undefined) vistaraPayload.voice = voice;
        if (first_message !== undefined) vistaraPayload.first_message = first_message.trim();
        if (agent_prompt !== undefined) {
          vistaraPayload.agent_prompt = agent_prompt.trim();
          vistaraPayload.system_instruction = agent_prompt.trim();
        }
        if (max_call !== undefined) {
          const duration = max_call !== '' && max_call !== null ? Number(max_call) : null;
          if (duration !== null) {
            vistaraPayload.max_call_duration = duration;
          }
        }
        if (isActive !== undefined) {
          vistaraPayload.status = isActive ? 'active' : 'inactive';
        }

        const headers = {
          'Content-Type': 'application/json',
        };

        if (apiKey) {
          headers['x-api-key'] = apiKey;

        }

        logger.info({ targetUrl, agentId: req.params.id }, 'Updating agent via external Vistara AI API');

        const response = await fetch(targetUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify(vistaraPayload),
        });

        if (response.ok) {
          const externalData = await response.json();
          const updated = externalData.agent || externalData.data || externalData;

          const normalizedAgent = {
            _id: updated.id || updated._id || req.params.id,
            id: updated.id || updated._id || req.params.id,
            name: updated.name || name,
            language: updated.language || language || 'English',
            voice: updated.voice || voice || 'meera',
            first_message: updated.first_message || first_message || '',
            agent_prompt:
              updated.system_instruction ||
              updated.agent_prompt ||
              agent_prompt ||
              '',
            max_call:
              updated.max_call_duration !== undefined
                ? updated.max_call_duration
                : max_call !== undefined
                  ? max_call
                  : null,
            isActive: updated.status === 'active' || isActive !== false,
            status: updated.status || 'active',
            raw: updated,
          };

          if (normalizedAgent.isActive && mongoose.connection?.readyState === 1) {
            await StoreSettings.findOneAndUpdate(
              {},
              {
                $set: {
                  aiAgentName: normalizedAgent.name,
                  aiVoiceLanguage: normalizedAgent.language,
                  aiAgentGreeting: normalizedAgent.first_message,
                  aiAgentTone: `Voice: ${normalizedAgent.voice}`,
                },
              },
              { upsert: true }
            );
          }

          logger.info({ agentId: req.params.id }, 'Agent updated successfully on Vistara AI');

          return res.status(200).json({
            success: true,
            message: externalData.message || 'Agent updated successfully on Vistara AI',
            agent: normalizedAgent,
          });
        }

        const errorText = await response.text();
        let errorMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.message || parsed.error || errorText;
        } catch {
          // Keep as text
        }

        logger.error({ status: response.status, error: errorMsg }, 'Vistara agent update failed');

        return res.status(response.status).json({
          success: false,
          message: errorMsg || 'Failed to update agent on Vistara AI',
        });
      } catch (externalErr) {
        logger.error({ error: externalErr.message }, 'Error reaching Vistara AI update API');
        return res.status(500).json({
          success: false,
          message: externalErr.message || 'Failed to reach Vistara AI agent update service',
        });
      }
    }

    // Fallback: If no VISTARA_AGENT_UPDATE_URL, update local database
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (language !== undefined) updates.language = language.trim();
    if (voice !== undefined) updates.voice = voice;
    if (first_message !== undefined) updates.first_message = first_message.trim();
    if (agent_prompt !== undefined) updates.agent_prompt = agent_prompt.trim();
    if (max_call !== undefined) {
      updates.max_call = max_call !== '' && max_call !== null ? Number(max_call) : null;
    }
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    let agent = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      agent = await Agent.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (agent.isActive && mongoose.connection?.readyState === 1) {
      await StoreSettings.findOneAndUpdate(
        {},
        {
          $set: {
            aiAgentName: agent.name,
            aiVoiceLanguage: agent.language,
            aiAgentGreeting: agent.first_message,
            aiAgentTone: `Voice: ${agent.voice}`,
          },
        },
        { upsert: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      agent,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAgent(req, res, next) {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

