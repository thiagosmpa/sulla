import dotenv from "dotenv"
dotenv.config()

import app from "./server"
const port = process.env.B_PORT || 3001

app.listen(port, () => {
  console.log(`\n\nBACKEND running on port ${port}\n\n`)
  })