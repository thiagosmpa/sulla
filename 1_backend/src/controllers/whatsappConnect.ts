import { Request, Response } from "express";
import { logging } from "../kafka/producer";
import prisma from "../db";
import axios from "axios";

const WHATSAPP_URL = process.env.WHATSAPP_URL || "http://localhost:3002";
const CONNECT_URL = `${WHATSAPP_URL}/sessions/add`;

const sessionsQR = new Map<string, string>();

async function getConnectionStatus(sessionId: string) {
  // status: wait_for_qrcode_auth, authenticated, pulling_wa_data, connected, disconnected
  try {
    const response = await prisma.session2.findUnique({
      where: { sessionId },
      select: { connectionStatus: true },
    });
    return response?.connectionStatus;
  } catch (error: any) {
    logging(`Connection Status Error: ${error}`);
  }
}

export const connect = async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  try {
    const connectionStatus = await getConnectionStatus(sessionId);
    if (connectionStatus === "connected") {
      return res.status(400).json({ error: "Already connected" });
    } else if (
      connectionStatus === "authenticated" ||
      connectionStatus === "pulling_wa_data"
    ) {
      return res.status(400).json({ error: "Please wait for the connection" });
    } else if (connectionStatus === "wait_for_qrcode_auth") {
      const qr = sessionsQR.get(sessionId);
      if (qr) {
        return res.json({ qr: qr });
      } else {
        return res.status(400).json({ error: "Please try again later" });
      }
    }

    const response = await axios.post(CONNECT_URL, { sessionId });

    if (response.data.qr) {
      const qrCode = response.data.qr;
      sessionsQR.set(sessionId, qrCode);
      return res.json({ qr: qrCode });
    }

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
