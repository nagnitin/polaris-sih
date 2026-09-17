export const stationData = {
  maitri: {
    id: "maitri",
    name: "Maitri Station",
    shortName: "Maitri",
    location: "Antarctica",

    health: 92,
    sensorsOnline: 48,
    totalSensors: 52,

    temperature: -12.4,
    windSpeed: 18,
    humidity: 62,
    pressure: 985,

    autonomy: 76,
    powerBackup: 12,
    waterSupply: 18,
    fuelSupply: 24,
    foodSupply: 16,

    alerts: 2,
  },

  bharati: {
    id: "bharati",
    name: "Bharati Station",
    shortName: "Bharati",
    location: "Antarctica",

    health: 88,
    sensorsOnline: 45,
    totalSensors: 50,

    temperature: -18.7,
    windSpeed: 32,
    humidity: 71,
    pressure: 978,

    autonomy: 68,
    powerBackup: 9,
    waterSupply: 14,
    fuelSupply: 19,
    foodSupply: 12,

    alerts: 3,
  },
};

export const healthHistory = [
  { day: "Mon", health: 78 },
  { day: "Tue", health: 84 },
  { day: "Wed", health: 87 },
  { day: "Thu", health: 92 },
  { day: "Fri", health: 76 },
  { day: "Sat", health: 85 },
  { day: "Sun", health: 89 },
];

export const environmentalHistory = [
  { time: "00:00", temperature: -14, wind: 15, humidity: 58 },
  { time: "04:00", temperature: -12, wind: 18, humidity: 62 },
  { time: "08:00", temperature: -13, wind: 20, humidity: 60 },
  { time: "12:00", temperature: -10, wind: 24, humidity: 65 },
  { time: "16:00", temperature: -12, wind: 18, humidity: 62 },
  { time: "20:00", temperature: -14, wind: 21, humidity: 64 },
];