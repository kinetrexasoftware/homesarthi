// Your computer's IP address from ipconfig
// IPv4 Address: 172.20.10.6
// If the app fails to connect, run 'ipconfig' and update this IP
// Fallback to your identified IP if .env is not loaded yet
const ENV_URL = process.env.EXPO_PUBLIC_SERVER_URL;
export const SERVER_URL = ENV_URL || "https://backend-homesarthi.onrender.com"
// export const SERVER_URL = ENV_URL || "http://10.212.167.46:5000";
export const API_URL = `${SERVER_URL}/api`;

console.log(`[Config] Connecting to: ${SERVER_URL}`);
