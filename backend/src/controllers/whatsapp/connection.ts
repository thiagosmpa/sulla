import { Request, Response } from "express";
import { sendMessage } from "../../kafka/producer";
import { logging } from "../../kafka/producer";

export const connect = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    await sendMessage("whatsapp-connection", [
      { key: id, value: JSON.stringify({ id }) },
    ]);
    logging(`Connection request: ${id}`);
    res.status(200).send("Conectado");
  } catch (error) {
    logging(`Error connecting: ${id}: ${error}`);
    res.status(500).send("Erro ao conectar");
  }
};
