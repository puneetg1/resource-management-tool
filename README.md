## Local Data Manager (React, No Backend)

Local-first React app with login, schema-driven forms, CRUD, JSON/Excel import-export, and a dashboard. All data stays in your browser (localStorage). No server required.

### Setup
1) Install dependencies
```bash
npm install
```
2) Run the app
```bash
npm run dev
```
3) Open the shown URL (usually `http://localhost:5173`).

### Login credentials
- File: `src/config.js`
- Edit the `DUMMY_USERS` array to set usernames/passwords.
```js
export const DUMMY_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' }
]
```
- Go to `/login` and sign in. Successful login redirects to `/dashboard`.

### Where to place the form schema
- Path: `public/input-data/schema.json`
- The app loads this at runtime to generate the form on `/records`.
```json
{
  "title": "Demo Schema",
  "fields": [
    { "name": "name", "label": "Name", "type": "text" },
    { "name": "amount", "label": "Amount", "type": "number" },
    { "name": "category", "label": "Category", "type": "text" }
  ]
}
```
- Supported `type`: `text`, `number`.
- To change the location, update `SCHEMA_URL` in `src/utils/data.js`.

### Using the app
- Dashboard: `/dashboard` shows charts from saved records.
- Records: `/records` lets you add/edit/delete records based on the schema.
- Storage: Data is saved in `localStorage` under `app_records`.
- Import/Export: From `/records`, export to JSON/Excel and import JSON/Excel.

### Build for production
```bash
npm run build
npm run preview
```
Deploy the `dist/` folder with `public/input-data/schema.json` accessible at the same path.
