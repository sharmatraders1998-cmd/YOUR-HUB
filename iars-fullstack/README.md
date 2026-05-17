# IARS Full-Stack Dashboard

Full working starter with:
- Login/Register (JWT + bcrypt)
- Chat endpoint (server processed)
- Code help endpoint
- Image prompt generator endpoint
- Voice input on frontend (browser SpeechRecognition)

## Run

### 1) Server
```bash
cd iars-fullstack/server
npm install
npm run dev
```

Server runs on `http://localhost:4000`.

### 2) Client
Open `iars-fullstack/client/index.html` in browser (or serve via any static server).

Default API base is `http://localhost:4000/api`.

## Notes
- Data is persisted in `server/data.json` for simplicity.
- Replace demo assistant logic in `POST /api/assistant/chat` with OpenAI API integration.
