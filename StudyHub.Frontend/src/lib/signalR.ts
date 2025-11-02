import * as signalR from "@microsoft/signalr";

export const createClassConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:6789/hubs/class-notification`)
    .withAutomaticReconnect()
    .build();
