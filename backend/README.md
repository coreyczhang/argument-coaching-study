# Point Taken Backend

## 🚀 Usage

Install dependencies:
```bash
npm install
```

### Environment Variables
Create a .env file, like such:
```bash
touch .env
```

In this .env file, you will need to populate the following fields (paste this into your .env file):
```sh
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
PRIVATEKEY=
```

⬆️ Ask Chris for the above information

### Development Server
Start the development server on 'http://localhost:8080':
```bash
npm run dev
```

In a separate terminal, run:
```bash
npx tsc -w
```
- This process watches for changes to any TypeScript file, and automatically compiles it into JavaScript (which lives in `/dist`)

