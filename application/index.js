"use strict";

import { bottom_bar, side_toaster, top_bar } from "./assets/js/helper.js";
import vectorTileLayer from "leaflet-vector-tile-layer";

import L from "leaflet";

import m from "mithril";
import { v4 as uuidv4 } from "uuid";
import L from "leaflet";

export let status = {
  default_lang: "de",
  userLang: navigator.language || navigator.userLanguage,
};

console.log(status);

let report = {
  set: false,
  lat: 46.57591,
  lng: 7.84956,
  img: "",
  category: "",
  email: "",
  id: uuidv4(),
};

let translation;
if (status.userLang == "de-DE") {
  translation = {
    impressum: "<strong>Impressum & Datenschutz</strong>",
    impressum_text: "Ihre Daten...",
    success_text:
      "Vielen Dank für deine Meldung!<br><br> Wir freuen uns über deine Unterstützung und Mitarbeit, um unsere Stadt in Schuss zu halten. Dein Hinweis hilft uns, Schäden schnell zu beheben und unsere Infrastruktur in einem guten Zustand zu halten. <br>Wir kümmern uns so schnell wie möglich darum und halten dich auf dem Laufenden, falls du deine E-Mail-Adresse hinterlegt hast.",
    description:
      "Mit dieser App kannst du Schäden an Straßen, Gebäuden und anderen öffentlichen Einrichtungen ganz einfach melden. Hilf mit, unsere Stadt in Schuss zu halten!<br><br>Im nächsten Schritt kannst du den Schaden auf einer Karte markieren, ein Foto hochladen und eine kurze Beschreibung hinzufügen. Wenn du über den Fortschritt informiert werden möchtest, kannst du deine E-Mail-Adresse angeben.",
  };
} else {
  translation = {
    impressum: "<strong>Impressum & Datenschutz</strong>",
    impressum_text: "Ihre Daten...",
    success_text:
      "Vielen Dank für deine Meldung!<br><br> Wir freuen uns über deine Unterstützung und Mitarbeit, um unsere Stadt in Schuss zu halten. Dein Hinweis hilft uns, Schäden schnell zu beheben und unsere Infrastruktur in einem guten Zustand zu halten. <br>Wir kümmern uns so schnell wie möglich darum und halten dich auf dem Laufenden, falls du deine E-Mail-Adresse hinterlegt hast.",
    description:
      "Mit dieser App kannst du Schäden an Straßen, Gebäuden und anderen öffentlichen Einrichtungen ganz einfach melden. Hilf mit, unsere Stadt in Schuss zu halten!<br><br>Im nächsten Schritt kannst du den Schaden auf einer Karte markieren, ein Foto hochladen und eine kurze Beschreibung hinzufügen. Wenn du über den Fortschritt informiert werden möchtest, kannst du deine E-Mail-Adresse angeben.",
  };
}

let map_func = () => {
  let marker_current_position;

  let map = new L.Map("map", {
    crs: L.CRS.EPSG3857,
    minZoom: 10,
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
    fetchOptions: {
      method: "GET",
      mode: "no-cors",
    },
  };
  let vectorURL =
    "https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/{z}/{x}/{y}.pbf";
  const vectorLayer = vectorTileLayer(vectorURL, options);

  //default
  const default_layer = L.tileLayer(
    "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    { maxNativeZoom: 18, maxZoom: 20 }
  );

  //sat
  const osm = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxNativeZoom: 18, maxZoom: 20 }
  );

  var d = L.tileLayer.wms("https://wms.geo.admin.ch/", {
    layers:
      "ch.swisstopo.amtliches-gebaeudeadressverzeichnis,ch.swisstopo.amtliches-strassenverzeichnis",
    SERVICE: "WMS",
    REQUEST: "GetMap",
    format: "image/png",
    transparent: true,
    TILED: true,
    TileSetId: 30,
    attribution: "map.geo.admin.ch",
    cacheMaxAge: 2592000000,
    useCache: true,
    maxNativeZoom: 18,
    maxZoom: 20,
    minZoom: 16,
    crossOrigin: true,
  });

  map.addLayer(osm);
  map.addLayer(d);

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
        marker_current_position.bindPopup(
          "<p>Bewege mich zum Ort der Schadens</p>",
          {
            closeOnClick: true,
            autoClose: false,
          }
        );
      }
      marker_current_position.openPopup();

      report.lat = position.coords.longitude;
      report.lng = position.coords.latitude;
    } else {
      map.setView([report.lat, report.lng], 20);
      marker_current_position.setLatLng([report.lat, report.lng], 20);
      if (!marker_current_position.getPopup()) {
        marker_current_position.bindPopup(
          "<p>Bewege mich zum Ort der Schadens</p>",
          {
            closeOnClick: true,
            autoClose: false,
          }
        );
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
      report.set = true;
      marker_current_position.closeTooltip();
    });

    //move marker
    marker_current_position.on("dragstart", function (e) {
      map.dragging.disable(); // Disable map dragging
      popup = null;
    });

    marker_current_position.on("dragend", function (e) {
      map.dragging.enable(); // Re-enable map dragging
      var marker = e.target;
      var position = marker.getLatLng();

      report.lat = position.lat;
      report.lng = position.lng;
      report.set = true;
    });
  }

  function error() {
    side_toaster("Sorry, no position available.", 2000);
  }
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
          }, 5000);
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
    return m("div", { id: "map-wrapper" }, [
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
          m("nav", { class: "flex width-100 justify-content-center" }, [
            m(
              "button",
              {
                class: "item ",
                onclick: () => {
                  m.route.set("/getImage");
                },
              },
              "Schaden fotografieren"
            ),
            m(
              "button",
              {
                class: "item",
                onclick: () => {
                  m.route.set("/send");
                },
              },
              "weiter >"
            ),
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
        class: {
          class: "page width-100 height-100 flex justify-content-center",
        },

        oncreate: () => {
          top_bar("", "", "");
          bottom_bar("", "", "");
        },
      },
      [
        m("div", { class: "flex justify-content-center" }, [
          m(
            "div",
            {
              class: "width-100 flex justify-content-center",
              style: "padding:40px 0 0 0;",
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
            class: "width-100 b-0  flex width-100 justify-content-center",
            style: "margin-top: auto;",
          },
          [
            m(
              "button",
              {
                tabindex: 0,
                class: "item ",

                onclick: () => {
                  m.route.set("/map");
                },
              },
              "Schaden melden"
            ),
          ]
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
        class: {
          class: "page width-100 height-100 flex justify-content-center",
        },

        oncreate: () => {
          top_bar("", "", "");
          bottom_bar("", "", "");
        },
      },
      [
        m("div", { class: "a-0 flex justify-content-center" }, [
          m(
            "div",
            {
              class: "width-100 flex justify-content-center",
              style: "margin:20px 0 100px 0; padding:10px",
            },
            [m("div", { class: "text" }, m.trust(translation.impressum_text))]
          ),
        ]),

        m(
          "nav",
          {
            class: "width-100 b-0  flex width-100 justify-content-center",
            style: "margin-top: auto;", // Pushes this div to the bottom
          },
          [
            m(
              "button",
              {
                tabindex: 0,
                class: "item ",

                onclick: () => {
                  m.route.set("/start");
                },
              },
              "zurück"
            ),
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
    return m("div", { class: "width-100" }, [
      m("canvas", {
        id: "canvas",
        style: { display: "block" },
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

            // Navigate to the overview route
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
          top_bar("", "", "");
          bottom_bar("", "", "");

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
      { class: "page width-100 height-100 flex justify-content-center" },
      [
        m("img", { id: "overview-img", src: report.img }),
        m("nav", { class: "flex width-100 justify-content-center" }, [
          m(
            "button",
            {
              onclick: () => {
                m.route.set("/getImage");
              },
            },
            "Foto ersetzen"
          ),

          m(
            "button",
            {
              onclick: () => {
                m.route.set("/send");
              },
            },
            "weiter >"
          ),
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
        class: "width-100 height-100 justify-content-center algin-item-start",
      },
      [
        m(
          "form",
          {
            class: "flex justify-content-center",
          },
          [
            m("div", { class: "text" }, "Beschreiben Sie kurz den Schaden"),
            m("textarea", {
              rows: 20,
              cols: 50,
            }),
            m(
              "div",
              { class: "text" },
              "Wenn Sie möchten, tragen Sie Ihre E-Mail-Adresse ein, um eine Benachrichtigung zur Schadensmeldung zu erhalten."
            ),
            m("input", {
              class: "text",
              type: "email",
              placeholder: "E-Mail",
              oninput: (e) => {
                report.email = e.target.value;
              },
            }),
          ]
        ),

        m("nav", { class: "flex width-100 justify-content-center" }, [
          m(
            "button",
            {
              onclick: () => {
                m.route.set("/success");
              },
            },
            "Schaden senden"
          ),
          m(
            "button",
            {
              onclick: () => {
                m.route.set("/map");
              },
            },
            "zurück zur Karte"
          ),
        ]),
      ]
    );
  },
};

var success = {
  view: function () {
    return m(
      "div",
      { class: "width-100 height-100 flex justify-content-center" },
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
