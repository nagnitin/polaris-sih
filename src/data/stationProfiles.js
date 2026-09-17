/*
  Physical station reference data.

  Source: NCPOR / COMNAP Catalogue of Antarctic Stations (public material).
  Engineering limits, sensor inventories and operating thresholds are NOT
  published, so everything used by the live twin is prototype/configurable
  data and is labelled as such in the UI.
*/

export const stationProfiles = {
  maitri: {
    id: "maitri",
    name: "Maitri Station",
    shortName: "Maitri",
    operator: "NCPOR — National Centre for Polar & Ocean Research",
    coordinates: "70°46'00.6\"S  11°43'50.8\"E",
    region: "Schirmacher Oasis, Dronning Maud Land",
    established: "1989",
    operationalPeriod: "Year-round",
    altitude: "117 m",
    climateZone: "Coastal Antarctica",
    permafrost: "Continuous",

    climate: [
      { label: "Mean annual temperature", value: "-9.7 °C" },
      { label: "Mean temperature (February)", value: "-3 °C" },
      { label: "Mean temperature (July)", value: "-16.8 °C" },
      { label: "Mean annual wind speed", value: "31.5 km/h" },
      { label: "Max recorded wind speed", value: "204 km/h" },
      { label: "Dominant wind direction", value: "SE" },
      { label: "Sea ice break up", value: "February – March" },
      { label: "Snow free period", value: "Jan, Feb, Dec" },
    ],

    facilities: [
      { label: "Area under roof", value: "1,030 m²" },
      { label: "Scientific laboratories", value: "105 m²" },
      { label: "Logistic area", value: "449 m²" },
      { label: "Number of beds", value: "65" },
      { label: "Max personnel at a time", value: "65" },
      { label: "Medical facility", value: "22 m²" },
      { label: "Power supply", value: "Fossil fuel · 220 V · 24 h" },
      { label: "Closest emergency facility", value: "3.5 km" },
    ],

    personnel: {
      summerStaff: 20,
      summerScientists: 25,
      winterStaff: 18,
      winterScientists: 7,
    },

    laboratories: "Geology, Geophysics",
    disciplines:
      "Atmospheric chemistry & physics, Climate change, Geodesy, Geology, " +
      "Geomorphology, Geophysics, Glaciology, Isotopic chemistry, Mapping, " +
      "Paleolimnology, Sedimentology",
    transport: "Air, Land · 4WD, Airplane, Helicopter, Ship, Skidoo",
    notes:
      "Inland station on an ice-free rocky area of the Schirmacher Oasis, " +
      "about 100 km from the sea with an intervening ice shelf. Replaced " +
      "Dakshin Gangotri, which was decommissioned in 1990.",
  },

  bharati: {
    id: "bharati",
    name: "Bharati Station",
    shortName: "Bharati",
    operator: "NCPOR — National Centre for Polar & Ocean Research",
    coordinates: "69°24'24.4\"S  76°11'42.9\"E",
    region: "Larsemann Hills, Stornes Peninsula",
    established: "18 March 2012",
    operationalPeriod: "Year-round",
    altitude: "35 m",
    climateZone: "Coastal Antarctica",
    permafrost: "None",

    climate: [
      { label: "Mean annual temperature", value: "-10.2 °C" },
      { label: "Mean temperature (February)", value: "-4.6 °C" },
      { label: "Mean temperature (July)", value: "-17.6 °C" },
      { label: "Mean annual wind speed", value: "22 km/h" },
      { label: "Max recorded wind speed", value: "122 km/h" },
      { label: "Dominant wind direction", value: "E" },
      { label: "Total annual precipitation", value: "287 mm" },
      { label: "Sea ice break up", value: "February" },
    ],

    facilities: [
      { label: "Area under roof", value: "2,900 m²" },
      { label: "Scientific laboratories", value: "270 m²" },
      { label: "Logistic area", value: "332 m²" },
      { label: "Number of beds", value: "47" },
      { label: "Max personnel at a time", value: "47" },
      { label: "Medical facility", value: "54 m²" },
      { label: "Power supply", value: "Fossil fuel · 220 V · 24 h" },
      { label: "Conference room capacity", value: "70" },
    ],

    personnel: {
      summerStaff: 24,
      summerScientists: 22,
      winterStaff: 18,
      winterScientists: 5,
    },

    laboratories: "Biology, Chemistry, Geology",
    disciplines:
      "Atmospheric chemistry & physics, Climate change, Environmental " +
      "sciences, Geology, Geomorphology, Geophysics, Glaciology, Human " +
      "biology, Isotopic chemistry, Mapping, Paleolimnology, Sedimentology",
    transport: "Air, Sea · Airplane, Helicopter, Ship, Skidoo, Walking",
    notes:
      "Modular three-storey structure on a promontory between Thala Fjord " +
      "and Quilty Bay, about 3,000 km from Maitri. Built from 134 " +
      "containerised modules with a seawater pump house and reverse-osmosis " +
      "water plant.",
  },
};

export const stationList = [
  stationProfiles.maitri,
  stationProfiles.bharati,
];
