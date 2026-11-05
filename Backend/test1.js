const response = await fetch('https://app.vistaraai.in/api/v1/agents?status=active&page=1&limit=20', {
    method: 'GET',
    headers: {
        'x-api-key': 'vs_d370abad930d9e698703a515481481d2e69173356f6384c6e96d633a59989385'
    }
});
const data = await response.json();
console.log(data);