"use strict";

import { bottom_bar, side_toaster, top_bar } from "./assets/js/helper.js";
import L from "leaflet";
import m from "mithril";
import { v4 as uuidv4 } from "uuid";
import vectorTileLayer from "leaflet-vector-tile-layer";
import maplibreGL from "@maplibre/maplibre-gl-leaflet";
import { point, polygon, booleanPointInPolygon } from "@turf/turf";
import proj4 from "proj4";
import "proj4leaflet";

import dotenv from "dotenv";
dotenv.config();

//coord converter
proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 " +
    "+k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel " +
    "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);

// Define EPSG:4326 (WGS84) and EPSG:2056 (LV95 - Swiss system)
let wgs84 = "+proj=longlat +datum=WGS84 +no_defs"; // WGS84
let lv95 =
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +datum=WGS84 +units=m +no_defs"; // Swiss LV95

// Convert from WGS84 (lat/lng) to LV95
function WGS84toLV95(lat, lng) {
  let [easting, northing] = proj4(wgs84, lv95, [lng, lat]);

  return {
    easting,
    northing,
  };
}

//check if lat,lng in zone
let check_if_point_in_zone = (lat, lng, zone) => {
  const ppoint = point([lng, lat]);
  return booleanPointInPolygon(ppoint, zone);
};

let owner_zone = "";
let city_zone = "";
let ccity_zone = "";

fetch(process.env.public_private_zone, { mode: "cors" }) // Change to "cors" for typical use cases
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok"); // Error handling for non-2xx responses
    }
    return response.json(); // Parsing the response as JSON
  })
  .then((data) => {
    owner_zone = data.grundeigentum_privates.features;
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

fetch(process.env.zone, { mode: "cors" }) // Change to "cors" for typical use cases
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok"); // Error handling for non-2xx responses
    }
    return response.json(); // Parsing the response as JSON
  })
  .then((data) => {
    city_zone = data.feature.geometry.coordinates[0][0];
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

export let status = {
  default_lang: "de",
  userLang: navigator.language || navigator.userLanguage,
};

let report = {
  set: false,
  lat: 47.143299,
  lng: 7.24876,
  img: null,
  email: null,
  id: uuidv4(),
  updateUser: false,
  owner: "public",
};

let translation;
let trans = () => {
  if (status.userLang.includes("de-DE")) {
    translation = {
      button_0: "ohne Foto weiter >",
      button_1: "Schaden fotografieren",
      button_2: "Schaden melden",
      button_3: "Schaden senden",
      button_4: "< zur Karte",
      button_5: "< zurück",
      button_6: "Foto ersetzen",
      button_7: "weiter >",
      button_8: "Foto auswählen",

      form_message_0: "Es ist ein Fehler aufgetreten",
      form_message_1: "Bitte beschreibe den Schaden",
      form_message_2: "Die E-Mailadresse ist ungültig",
      form_message_3: "Schadensmeldung",

      form_text_0: "Beschreibe kurz den Schaden",
      form_text_1:
        "Deine E-Mailadresse benötigen wir für eventuelle Rückfragen.",
      form_text_2:
        "Ich möchte über den Verlauf des Schadens informiert werden.",
      form_toggle_true: "Ja",

      form_toggle_false: "Nein",

      map_marker_is_outside:
        "Du kannst Schäden nur imnerhalb der Gemeindegrenze melden",

      map_marker_popup: "<p>Bewege mich zum Ort der Schadens</p>",

      impressum: "<strong>Impressum & Datenschutz</strong>",
      impressum_text:
        "<h1>Datenschutz</h1><h1>Lizenzen</h1>Mithril MIT<br>Leaflet MIT<br>GeoAdmin<h2>Code</h2><a href='https://github.com/strukturart/fixit'>https://github.com/strukturart/fixit</a>",
      success_text:
        "Vielen Dank für deine Meldung!<br><br> Wir freuen uns über deine Unterstützung und Mitarbeit, um unsere Stadt in Schuss zu halten. Dein Hinweis hilft uns, Schäden schnell zu beheben und unsere Infrastruktur in einem guten Zustand zu halten. <br>Wir kümmern uns so schnell wie möglich darum und halten dich auf dem Laufenden.",
      description:
        "<h1>Schaden melden</h1><h2>Hilf mit, unsere Stadt in Schuss zu halten!</h2><br>Mit dieser App kannst du Schäden an Straßen, Gebäuden und anderen öffentlichen Einrichtungen ganz einfach melden.<br><br>Im nächsten Schritt kannst du den Schaden auf einer Karte markieren, ein Foto hochladen und eine kurze Beschreibung hinzufügen.",
    };
  } else {
    translation = {
      button_0: "continuer >",
      button_1: "Photographier les dégâts",
      button_2: "déclarer un dommage",
      button_3: "Envoyer un dommage",
      button_4: "retour à la carte",
      button_5: "< retour",
      button_6: "Foto ersetzen",
      button_7: "continuer >",
      button_8: "Foto auswählen",

      form_message_0: "Une erreur est survenue",
      form_message_1: "Veuillez décrire le dommage",
      form_message_2: "L'adresse e-mail n'est pas valide",
      form_message_3: "Schadensmeldung",

      form_text_0: "Décrivez brièvement le dommage",
      form_text_1:
        "Nous avons besoin de ton adresse e-mail pour d'éventuelles questions.",
      form_text_2: "Je souhaite être informé(e) de l'évolution du sinistre.",

      form_toggle_true: "Oui",

      form_toggle_false: "Non",

      map_marker_popup: "<p>Me déplacer vers le lieu du dommage</p>",

      map_marker_is_outside:
        "Vous ne pouvez déclarer les dommages que dans les limites communales",

      impressum: "<strong>Impressum & protection des données</strong>",
      impressum_text: "Ihre Daten...",
      success_text:
        "Merci beaucoup pour ton message !<br>  Nous nous réjouissons de ton soutien et de ta collaboration pour maintenir notre ville en bon état. Nous nous en occuperons le plus rapidement possible et nous te tiendrons au courant.",
      description:
        "<h1>Signaler les dégâts</h1><h2>Aide-nous à maintenir notre ville en bon état !</h2><br><br>Grâce à cette application, tu peux facilement signaler les dommages causés aux rues, aux bâtiments et autres installations publiques. <br><br> Dans l'étape suivante, tu peux marquer le dommage sur une carte, télécharger une photo et ajouter une brève description.",
    };
  }
};

trans();

// Function to check if a point (lat, lng) is in a zone
let check_owner = (lat, lng) => {
  if (check_if_point_in_zone(lat, lng, ccity_zone)) {
    report.zone = true;
  } else {
    report.zone = false;
    side_toaster(translation.map_marker_is_outside, 3000);
  }

  report.owner = "public";

  for (let i = 0; i < owner_zone.length; i++) {
    const e = owner_zone[i];

    if (e.geometry.coordinates[0][0].length > 4) {
      try {
        // Transform the polygon coordinates from EPSG:2056 to EPSG:4326
        let transformedCoordinates = e.geometry.coordinates[0][0].map(
          (coord) => {
            return proj4("EPSG:2056", "EPSG:4326", coord); // Transform each point
          }
        );

        // Create a Turf.js polygon with the transformed coordinates
        let zone = polygon([transformedCoordinates]);

        // Check if the point is in the polygon
        if (check_if_point_in_zone(lat, lng, zone)) {
          report.owner = "private";
          console.log("Point is in the private zone!");
          break; // Stop the loop if the point is found in the polygon
        }
      } catch (error) {
        console.error("Error creating polygon for item:", e, error.message);
      }
    }
  }
  if (report.owner !== "private") {
    console.log("Point is in the public zone!");
  }
};

const send_mail = () => {
  const form = document.getElementById("form");

  const formData = new FormData(form);

  for (const [key, value] of Object.entries(report)) {
    if (key !== "set" && value != null) {
      formData.append(key, value);
    }
  }

  fetch("./assets/php/send-email.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        // Handle HTTP errors
        side_toaster(translation.form_message_0, 5000);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text(); // Parse the response as text
    })
    .then((text) => {
      console.log(text);
      // Handle the different cases based on the response content
      if (text.includes("description is empty")) {
        side_toaster(translation.form_message_1, 4000);
      }
      if (text.includes("Invalid email address.")) {
        side_toaster(translation.form_message_2, 4000);
      }
      if (text.includes("Message has been sent")) {
        report.img = "";
        report.description = "";
        report.email = "";

        m.route.set("/success");
      }
    })

    .catch((error) => {
      // Handle errors
      console.error("Fetch error:", error.message);
      side_toaster(translation.form_message_0, 5000);
    });
};

let map_func = () => {
  let marker_current_position;

  let map = new L.Map("map", {
    minZoom: 1,
    keyboard: true,
    zoomControl: true,
    enableHighAccuracy: true,
    maximumAge: 3000,
    timeout: 10000,
    crossOrigin: true,
  });

  //vector
  //https://gitlab.com/jkuebart/Leaflet.VectorTileLayer/

  let options = {
    minZoom: 1,
    maxZoom: 22,
    maxNativeZoom: 14,

    fetchOptions: {
      mode: "no-cors",
    },
  };
  let vectorURL =
    "https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.imagerybasemap.vt/v1.0.0/{z}/{x}/{y}.pbf";
  const vectorLayer = vectorTileLayer(vectorURL, options);

  let geoadmin = L.maplibreGL({
    style:
      "https://vectortiles.geo.admin.ch/styles/ch.swisstopo.imagerybasemap.vt/style.json",
  });

  var stadt_biel = L.tileLayer
    .wms(
      "https://biel-bienne.mapplus.ch/cgi-bin/mapserv?map=/data/Client_Data/biel-bienne/wms_stadtplan.map",
      {
        SERVICE: "WMS",
        crs: L.CRS.EPSG2056,
        format: "image/png",
        transparent: true,
        TILED: true,
        TileSetId: 30,
        attribution: "map.geo.admin.ch",
        maxNativeZoom: 20,
        maxZoom: 22,
        minZoom: 1,
        layers:
          "e321_stadtplan,sp_strassenmarkierungen,e322_fussgaengerstreifen,x_kronenflaeche_schematisch_shadows,e321_av_bodenbedeckung",
        version: "1.3.0",
      }
    )
    .addTo(map);

  //map.addLayer(vectorLayer);
  map.addLayer(stadt_biel);

  var baseMaps = {
    "Biel/Bienne": stadt_biel,
    "GeoAdmin": geoadmin,
  };

  L.control.layers(baseMaps).addTo(map);

  map.addEventListener("baselayerchange", function () {
    map.fire("click");
  });

  ccity_zone = polygon([city_zone]);

  // Define a style for the polygon
  let geoJsonStyle = {
    color: "blue", // Border color
    fillColor: "green", // Fill color
    fillOpacity: 0, // Opacity of the fill
    weight: 3, // Border thickness
  };

  // Add the polygon to the Leaflet map with the specified style
  L.geoJSON(polygon([city_zone]), { style: geoJsonStyle }).addTo(map);

  map.setView([report.lat, report.lng], 18);

  marker_current_position = L.marker([report.lat, report.lng], {
    draggable: true,

    icon: L.icon({
      iconUrl: "./assets/css/marker-icon.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: null,
    }),
  }).addTo(map);

  navigator.geolocation.getCurrentPosition(init_success, error);

  //default position
  let popup;
  function init_success(position) {
    if (!report.set || report.lat == undefined) {
      map.setView([position.coords.latitude, position.coords.longitude], 20);
      marker_current_position.setLatLng(
        [position.coords.latitude, position.coords.longitude],
        18
      );

      if (!marker_current_position.getPopup()) {
        marker_current_position.bindPopup(translation.map_marker_popup, {
          closeOnClick: true,
          autoClose: false,
        });
      }
      marker_current_position.openPopup();
      report.lat = position.coords.latitude;
      report.lng = position.coords.longitude;
      check_owner(report.lat, report.lng);
    } else {
      map.setView([report.lat, report.lng], 20);
      marker_current_position.setLatLng([report.lat, report.lng], 20);
      if (!marker_current_position.getPopup()) {
        marker_current_position.bindPopup(translation.map_marker_popup, {
          closeOnClick: true,
          autoClose: false,
        });
      }
      marker_current_position.openPopup();

      check_owner(report.lat, report.lng);
    }
  }

  function error() {
    side_toaster("Sorry, no position available.", 2000);

    map.setView([report.lat, report.lng], 20);
    marker_current_position.setLatLng([report.lat, report.lng], 20);
    if (!marker_current_position.getPopup()) {
      marker_current_position.bindPopup(translation.map_marker_popup, {
        closeOnClick: true,
        autoClose: false,
      });
    }
    marker_current_position.openPopup();
  }

  //set marker
  let buttonClicked = false;

  // Function to handle button clicks
  function handleButtonClick(e) {
    if (e.target.classList.contains("item")) {
      buttonClicked = true;
    }
  }

  // Attach event listeners to all buttons
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", handleButtonClick);
  });

  // Handle map clicks
  map.on("click", function (e) {
    if (buttonClicked) return; // Do nothing if a button was clicked
    popup = null;

    const latLng = e.latlng;
    marker_current_position.setLatLng(latLng);
    report.lat = latLng.lat;
    report.lng = latLng.lng;
    report.LV95 = WGS84toLV95(latLng.lat, latLng.lng);
    report.set = true;
    marker_current_position.closeTooltip();
    check_owner(latLng.lat, latLng.lng);

    console.log(report.LV95);

    let t = report.LV95.easting + "," + report.LV95.northing;

    let f =
      "https://www.openstreetmap.org/?mlat=" +
      report.lat +
      "&mlon=" +
      report.lng +
      "#map=18/" +
      report.lat +
      "/" +
      report.lng;

    console.log(f);

    console.log(
      "https://map.geo.admin.ch/?center=" + t + "&z=10&crosshair=cross"
    );
  });

  //move marker
  marker_current_position.on("dragstart", function (e) {
    map.dragging.disable(); // Disable map dragging
    popup = null;
  });

  marker_current_position.on("dragend", function (e) {
    map.dragging.enable();
    console.log(e);
    var marker = e.target;
    var position = marker.getLatLng();

    report.lat = position.lat;
    report.lng = position.lng;
    report.LV95 = WGS84toLV95(position.lat, position.lng);

    report.set = true;

    console.log(report);

    check_owner(position.lat, position.lng);
  });
};

let select_image = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".jpeg, .jpg, .png, .gif, .bmp, .webp";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.click();

  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const dataURL = event.target.result; // The data URL is here

        report.img = dataURL; // Set the data URL for report.img
        m.route.set("/imageView");
      };

      reader.readAsDataURL(file); // Convert file to Data URL
    }
  });
};

var root = document.getElementById("app");
var intro = {
  view: function () {
    return m(
      "div",
      {
        class: "width-100 height-100",
        id: "intro",
        oninit: function () {
          setTimeout(function () {
            m.route.set("/start");
          }, 3000);
        },
      },
      [
        m("img", {
          src: "./assets/icons/intro.svg",
          oncreate: () => {
            fetch("/manifest.webmanifest")
              .then((r) => r.json())
              .then((parsedResponse) => {
                status.version = parsedResponse.version;
                document.querySelector("#version").textContent =
                  parsedResponse.version;
              });
          },
        }),
        m("div", { id: "circle" }),
        m(
          "div",
          {
            class: "flex width-100  justify-content-center",
            id: "version-box",
          },
          [
            m(
              "kbd",
              {
                id: "version",
              },
              status.version
            ),
          ]
        ),
      ]
    );
  },
};

var map = {
  view: function () {
    return m("div", { class: "map-wrapper" }, [
      m(
        "div",
        {
          id: "map",
          class: "width-100",
          oncreate: () => {
            map_func();
          },
        },

        [
          m("div", { class: "flex justify-content-center" }, [
            m(
              "button",
              {
                class: "level-1",
                id: "button-photo",
                onclick: () => {
                  if (report.zone) {
                    select_image();
                  } else {
                    side_toaster(translation.map_marker_is_outside, 4000);
                  }
                },
              },
              [
                m(
                  "div",
                  m.trust(
                    translation.button_1 +
                      "<img class='camera-icon' src='/assets/image/camera.svg'>"
                  )
                ),
              ]
            ),
          ]),
          m("nav", { class: "flex width-100 justify-content-center" }, [
            m("div", { class: "nav-inner flex justify-content-spacebetween" }, [
              m(
                "button",
                {
                  class: "item level-0",
                  onclick: () => {
                    m.route.set("/start");
                  },
                },
                translation.button_5
              ),
              m(
                "button",
                {
                  class: "item",
                  onclick: () => {
                    if (report.zone) {
                      m.route.set("/send");
                    } else {
                      side_toaster(translation.map_marker_is_outside, 4000);
                    }
                  },
                },
                translation.button_0
              ),
            ]),
          ]),
        ]
      ),
    ]);
  },
};

var start = {
  view: function () {
    return m(
      "div",
      {
        class: "page width-100 flex justify-content-center algin-item-start",
      },
      [
        m(
          "div",
          {
            id: "lang-switch",
          },
          [
            m("input", {
              type: "checkbox",
              id: "switch",
            }),

            m(
              "label",
              {
                for: "switch",
                onclick: () => {
                  status.userLang.includes("fr")
                    ? (status.userLang = "de-DE")
                    : (status.userLang = "fr");

                  if (!status.userLang.includes("de-DE"))
                    document.querySelector("#switch").checked = false;

                  trans();

                  m.redraw();
                },
              },
              [m("div", [m("span", "DE"), m("span", "FR")])]
            ),
          ]
        ),
        m("div", { class: "flex justify-content-center" }, [
          m(
            "div",
            {
              class: "width-100 flex justify-content-center",
            },
            [
              m("div", { class: "text" }, m.trust(translation.description)),
              m(
                "div",
                {
                  class: "width-100 flex justify-content-center",
                },
                [
                  m(
                    "div",
                    {
                      class: "flex justify-content-center text",
                      onclick: () => {
                        m.route.set("/impressum");
                      },
                    },
                    m.trust(translation.impressum)
                  ),
                ]
              ),
            ]
          ),
        ]),

        m(
          "nav",
          {
            class: "width-100   flex width-100 justify-content-center",
          },
          m("div", { class: "nav-inner" }, [
            [
              m(
                "button",
                {
                  onclick: () => {
                    m.route.set("/map");
                  },
                },
                translation.button_2
              ),
            ],
          ])
        ),
      ]
    );
  },
};

var impressum = {
  view: function () {
    return m(
      "div",
      {
        class: "page width-100 height-100 flex justify-content-center",
      },
      [
        m("div", { class: "flex justify-content-center" }, [
          m(
            "div",
            {
              class: "width-100 flex justify-content-center",
            },
            [m("div", { class: "text" }, m.trust(translation.impressum_text))]
          ),
        ]),

        m(
          "nav",

          [
            m("div", { class: "nav-inner" }, [
              m(
                "button",
                {
                  onclick: () => {
                    m.route.set("/start");
                  },
                },
                translation.button_5
              ),
            ]),
          ]
        ),
      ]
    );
  },
};
var getImage = {
  video: null,
  canvas: null,
  stream: null,

  view: function () {
    return m("div", { class: "page width-100 flex justify-content-center" }, [
      m("canvas", {
        id: "canvas",
      }),
      m("nav", { class: "width-100 flex justify-content-center" }, [
        m("button", {
          id: "photo-shut-button",

          onclick: () => {
            if (!this.video || !this.canvas) {
              console.error("One or more elements are not initialized.");
              return;
            }

            // Set canvas dimensions to match the video
            const desiredWidth = this.video.videoWidth;
            const desiredHeight = this.video.videoHeight;

            this.canvas.width = desiredWidth;
            this.canvas.height = desiredHeight;

            // Draw the current video frame onto the canvas
            const context = this.canvas.getContext("2d");
            context.drawImage(this.video, 0, 0, desiredWidth, desiredHeight);

            // Convert the canvas to an image and store it
            const dataURL = this.canvas.toDataURL("image/jpeg");

            report.img = dataURL;

            // Stop the video stream
            if (this.stream) {
              this.stream.getTracks().forEach((track) => track.stop());
              this.stream = null;
            }

            m.route.set("/imageView");
          },
        }),
      ]),

      m("video", {
        autoplay: true,
        playsinline: true,

        class: "",
        id: "video",
        oncreate: (vnode) => {
          this.video = vnode.dom;
          this.canvas = document.getElementById("canvas");

          if (!this.video || !this.canvas) {
            console.error("Failed to find one or more elements.");
            return;
          }

          // Get access to the camera
          navigator.mediaDevices
            .getUserMedia({
              video: { facingMode: "environment" },
              audio: false,
            })
            .then((stream) => {
              this.stream = stream; // Store the stream
              this.video.srcObject = stream;

              // Handle the video metadata loaded event
              this.video.onloadedmetadata = () => {
                this.video.play();

                // Set canvas dimensions after video metadata is loaded
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
              };
            })
            .catch((err) => {
              console.error("Error accessing the camera: ", err);
            });
        },
      }),
    ]);
  },
};

var imageView = {
  view: function () {
    return m(
      "div",
      { class: "width-100 page flex justify-content-center algin-item-start" },
      [
        m("img", { id: "overview-img", src: report.img }),
        m("nav", { class: "flex width-100 justify-content-center" }, [
          m("div", { class: "nav-inner flex justify-content-spacebetween" }, [
            m(
              "button",
              {
                onclick: () => {
                  // m.route.set("/getImage");
                  select_image();
                },
              },
              translation.button_6
            ),

            m(
              "button",
              {
                onclick: () => {
                  m.route.set("/send");
                },
              },
              translation.button_7
            ),
          ]),
        ]),
      ]
    );
  },
};

var send = {
  view: function () {
    return m(
      "div",
      {
        id: "send",
        class:
          "page page-1 width-100 flex justify-content-center algin-item-start",
      },
      [
        m(
          "form",
          {
            id: "form",
            class: "flex justify-content-center",
          },
          [
            m("h1", {}, translation.form_message_3),
            m("div", { class: "text" }, translation.form_text_0),
            m("textarea", {
              rows: 20,
              cols: 50,
              name: "description",
            }),
            m("div", { class: "text" }, translation.form_text_1),
            m("input", {
              class: "text",
              type: "email",
              autocomplete: "email",
              placeholder: "E-Mail",
              oninput: (e) => {
                report.email = e.target.value;
              },
            }),

            m(
              "div",
              {
                class: "checkbox-container",
              },
              [
                m("input", {
                  type: "checkbox",
                  id: "myCheckbox",
                  checked: report.updateUser,
                  onchange: (e) => {
                    report.updateUser = e.target.checked;
                  },
                }),
                m(
                  "label",
                  { for: "myCheckbox", class: "checkbox-label" },
                  translation.form_text_2
                ),
                m(
                  "div",
                  {
                    class: "button-box  flex justify-content-center",
                  },
                  [
                    m(
                      "button",
                      {
                        class: "button-true",
                        onclick: (event) => {
                          event.preventDefault();
                          report.updateUser = true;
                          document.getElementById("myCheckbox").checked =
                            report.updateUser;
                        },
                      },
                      translation.form_toggle_true
                    ),
                    m(
                      "button",
                      {
                        class: "button-false",

                        onclick: (event) => {
                          event.preventDefault();
                          report.updateUser = false;
                          document.getElementById("myCheckbox").checked =
                            report.updateUser;
                        },
                      },
                      translation.form_toggle_false
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),

        m("nav", { class: "flex width-100 justify-content-center" }, [
          m("div", { class: "nav-inner flex justify-content-spacebetween" }, [
            m(
              "button",
              {
                class: "level-0",
                onclick: () => {
                  m.route.set("/map");
                },
              },
              translation.button_4
            ),
            m(
              "button",
              {
                onclick: () => {
                  send_mail();
                },
                class: "level-1",
              },
              translation.button_3
            ),
          ]),
        ]),
      ]
    );
  },
};

var success = {
  view: function () {
    return m(
      "div",
      { class: "page width-100 height-100 flex justify-content-center" },
      [
        m(
          "div",
          {
            class: "text",
            oncreate: () => {
              setTimeout(() => {
                m.route.set("/start");
              }, 6000);
            },
          },
          m.trust(translation.success_text)
        ),
      ]
    );
  },
};

m.route(root, "/intro", {
  "/intro": intro,
  "/start": start,
  "/map": map,
  "/getImage": getImage,
  "/imageView": imageView,
  "/send": send,
  "/success": success,
  "/impressum": impressum,
});
