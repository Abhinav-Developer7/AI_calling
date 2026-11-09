import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { Agent } from '../../src/models/Agent.js';

describe('AI Voice Agent API & Model Validation', () => {
  it('GET /api/v1/agents without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/agents');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/agents without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/agents')
      .send({
        name: 'Meera',
        language: 'English',
        voice: 'meera',
        first_message: 'Hello, this is Meera.',
        agent_prompt: 'System prompt instructions.',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Agent Model should validate required fields', async () => {
    const invalidAgent = new Agent({});
    const validationError = invalidAgent.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError.errors.name).toBeDefined();
    expect(validationError.errors.first_message).toBeDefined();
    expect(validationError.errors.agent_prompt).toBeDefined();
  });

  it('Agent Model should set default language to English and voice to meera', () => {
    const agent = new Agent({
      name: 'Test Agent',
      first_message: 'Initial greeting message',
      agent_prompt: 'System instructions',
    });
    expect(agent.language).toBe('English');
    expect(agent.voice).toBe('meera');
    expect(agent.isActive).toBe(true);
  });

  it('Agent Model should enforce voice enum options (meera, nisha, siya, rohan, dev, vikram)', () => {
    const validVoices = ['meera', 'nisha', 'siya', 'rohan', 'dev', 'vikram'];
    for (const v of validVoices) {
      const agent = new Agent({
        name: 'Test',
        voice: v,
        first_message: 'Greeting',
        agent_prompt: 'Prompt',
      });
      const err = agent.validateSync();
      expect(err).toBeUndefined();
    }

    const invalidVoiceAgent = new Agent({
      name: 'Test',
      voice: 'unsupported_voice',
      first_message: 'Greeting',
      agent_prompt: 'Prompt',
    });
    const err = invalidVoiceAgent.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.voice).toBeDefined();
  });

  it('Agent Model should reject first_message exceeding 5000 characters', () => {
    const longGreeting = 'A'.repeat(5001);
    const agent = new Agent({
      name: 'Test',
      first_message: longGreeting,
      agent_prompt: 'Prompt',
    });
    const err = agent.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.first_message).toBeDefined();
  });

  it('Agent Model should reject agent_prompt exceeding 45000 characters', () => {
    const longPrompt = 'B'.repeat(45001);
    const agent = new Agent({
      name: 'Test',
      first_message: 'Greeting',
      agent_prompt: longPrompt,
    });
    const err = agent.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.agent_prompt).toBeDefined();
  });

  it('listAgents should normalize external Vistara API agents into expected frontend format', async () => {
    const mockAgents = [
      {
        id: 'vistara-agent-123',
        name: 'Vistara Meera',
        language: 'Malayalam',
        voice: 'meera',
        first_message: 'Namaskaram!',
        max_call_duration: 4,
        status: 'active',
      },
    ];

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAgents,
        pagination: { total: 1 },
      }),
    });

    try {
      const { listAgents } = await import('../../src/controllers/agentController.js');
      const req = {};
      let jsonResult = null;
      let statusResult = null;
      const res = {
        status: (code) => {
          statusResult = code;
          return {
            json: (payload) => {
              jsonResult = payload;
              return payload;
            },
          };
        },
      };

      await listAgents(req, res, () => {});
      expect(statusResult).toBe(200);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.agents).toBeDefined();
      expect(jsonResult.agents[0]._id).toBe('vistara-agent-123');
      expect(jsonResult.agents[0].name).toBe('Vistara Meera');
      expect(jsonResult.agents[0].max_call).toBe(4);
      expect(jsonResult.agents[0].isActive).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('updateAgent should dispatch PUT to Vistara AI and return normalized response', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = null;

    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);

      return {
        ok: true,
        json: async () => ({
          success: true,
          message: 'Agent updated successfully',
          agent: {
            id: 'bed46aad-ee8f-45c9-b53e-d3b635a86f38',
            name: capturedBody.name,
            language: capturedBody.language,
            voice: capturedBody.voice,
            first_message: capturedBody.first_message,
            max_call_duration: capturedBody.max_call_duration,
            status: capturedBody.status,
          },
        }),
      };
    };

    try {
      const { updateAgent } = await import('../../src/controllers/agentController.js');
      const req = {
        params: { id: 'bed46aad-ee8f-45c9-b53e-d3b635a86f38' },
        body: {
          name: 'Updated Anjali',
          language: 'Malayalam',
          voice: 'meera',
          first_message: 'Namaskaram!',
          agent_prompt: 'Guidelines',
          max_call: 5,
          isActive: true,
        },
      };

      let jsonResult = null;
      let statusResult = null;
      const res = {
        status: (code) => {
          statusResult = code;
          return {
            json: (payload) => {
              jsonResult = payload;
              return payload;
            },
          };
        },
      };

      await updateAgent(req, res, () => {});
      expect(statusResult).toBe(200);
      expect(capturedMethod).toBe('PUT');
      expect(capturedUrl).toContain('bed46aad-ee8f-45c9-b53e-d3b635a86f38');
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.agent.name).toBe('Updated Anjali');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('updateAgent should return error message to frontend when Vistara API responds with error', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Invalid voice selection' }),
    });

    try {
      const { updateAgent } = await import('../../src/controllers/agentController.js');
      const req = {
        params: { id: 'bed46aad-ee8f-45c9-b53e-d3b635a86f38' },
        body: { voice: 'invalid' },
      };

      let jsonResult = null;
      let statusResult = null;
      const res = {
        status: (code) => {
          statusResult = code;
          return {
            json: (payload) => {
              jsonResult = payload;
              return payload;
            },
          };
        },
      };

      await updateAgent(req, res, () => {});
      expect(statusResult).toBe(400);
      expect(jsonResult.success).toBe(false);
      expect(jsonResult.message).toContain('Invalid voice selection');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('createAgent should dispatch POST to Vistara AI and return 201 with normalized agent', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = null;

    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);

      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          message: 'Agent created successfully',
          agent: {
            id: 'new-vistara-agent-456',
            name: capturedBody.name,
            language: capturedBody.language,
            voice: capturedBody.voice,
            first_message: capturedBody.first_message,
            system_instruction: capturedBody.system_instruction,
            max_call_duration: capturedBody.max_call_duration,
            status: capturedBody.status,
          },
        }),
      };
    };

    try {
      const { createAgent } = await import('../../src/controllers/agentController.js');
      const req = {
        body: {
          name: 'New AI Agent',
          language: 'English',
          voice: 'meera',
          first_message: 'Hello!',
          agent_prompt: 'Full instructions',
          max_call: 3,
        },
      };

      let jsonResult = null;
      let statusResult = null;
      const res = {
        status: (code) => {
          statusResult = code;
          return {
            json: (payload) => {
              jsonResult = payload;
              return payload;
            },
          };
        },
      };

      await createAgent(req, res, () => {});
      expect(statusResult).toBe(201);
      expect(capturedMethod).toBe('POST');
      expect(capturedUrl).toContain('agents');
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.agent.name).toBe('New AI Agent');
      expect(jsonResult.agent._id).toBe('new-vistara-agent-456');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('createAgent should return error to frontend when Vistara API responds with error', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ message: 'Name already exists' }),
    });

    try {
      const { createAgent } = await import('../../src/controllers/agentController.js');
      const req = {
        body: {
          name: 'Duplicate Agent',
          first_message: 'Hi',
          agent_prompt: 'Instructions',
        },
      };

      let jsonResult = null;
      let statusResult = null;
      const res = {
        status: (code) => {
          statusResult = code;
          return {
            json: (payload) => {
              jsonResult = payload;
              return payload;
            },
          };
        },
      };

      await createAgent(req, res, () => {});
      expect(statusResult).toBe(422);
      expect(jsonResult.success).toBe(false);
      expect(jsonResult.message).toContain('Name already exists');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

