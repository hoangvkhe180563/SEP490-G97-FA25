import * as signalR from "@microsoft/signalr";
import { axiosInstance } from "./axios";

export const createClassConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:6789/hubs/class-notification`)
    .withAutomaticReconnect()
    .build();

function hubBase() {
  const base = axiosInstance.defaults.baseURL || "http://localhost:6789/api";
  return base.replace(/\/api\/?$/i, "").replace(/\/$/, "");
}

export function createPresenceConnection() {
  const base = hubBase();
  return new signalR.HubConnectionBuilder()
    .withUrl(`${base}/hubs/user-presense`, { withCredentials: true })
    .withAutomaticReconnect()
    .build();
}

export function createChatConnection() {
  const base = hubBase();
  return new signalR.HubConnectionBuilder()
    .withUrl(`${base}/hubs/qa-chat`, { withCredentials: true })
    .withAutomaticReconnect()
    .build();
}

export function createPaymentConnection() {
  const base = hubBase();
  const url = `${base}/hubs/payment`;
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .build();
}
