const items = [{id: "1", title: "Python Programming"}, {id: "2", title: "JavaScript Basics"}];
fetch('http://127.0.0.1:3000/api/agentic-match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentType: 'Library Books', documentText: 'i want to learn python', items })
}).then(r => r.json()).then(console.log).catch(console.error);
