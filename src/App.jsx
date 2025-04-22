import {
  CalciteAction,
  CalciteAvatar,
  CalciteButton,
  CalciteFlow,
  CalciteFlowItem,
  CalciteList,
  CalciteListItem,
  CalciteListItemGroup,
  CalcitePanel,
  CalciteShell,
  CalciteShellPanel,
} from "@esri/calcite-components-react";
import { useEffect, useRef, useState } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import PortalItem from "@arcgis/core/portal/PortalItem";
import LayerList from "@arcgis/core/widgets/LayerList";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import GraphicLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import apArrow from "./assets/arrow.svg";
import fpArrow from "./assets/fparrow.svg";
import CaptureImage from "./components/CaptureImage";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import Expand from "@arcgis/core/widgets/Expand.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { createRoot } from "react-dom/client";
import CreateImagePopup from "./components/ImagePopup";
import Popup from "@arcgis/core/widgets/Popup";
function App() {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const apLayer = useRef(null);
  const fpLayer = useRef(null);

  const [photosActive, setPhotosActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [apFeatures, setApFeatures] = useState([]);
  const [fpFeatures, setFpFeatures] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portal = new PortalItem({
      id: params.get("id"),
    });
    if (!viewRef.current) {
      mapRef.current = new Map({
        basemap: "streets-vector",
      });
      viewRef.current = new MapView({
        container: "map-view",
        map: mapRef.current,
        center: [80.5929, 16.4937],
        zoom: 11,
      });

      portal.load().then((item) => {
        const renderer = new SimpleRenderer({
          symbol: {
            type: "picture-marker",
            width: "40px",
            height: "40px",
            url: apArrow,
          },
          visualVariables: [
            {
              type: "rotation",
              field: "direction",
              rotationType: "geographic",
              valueUnit: "degrees",
            },
          ],
        });
        const geojsonlayer = new GeoJSONLayer({
          portalItem: item,
          renderer: renderer,
          popupTemplate: {
            title: "{title}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "comment", label: "Comment" },
                  { fieldName: "direction", label: "Direction" },
                  { fieldName: "startdate", label: "Start Date" },
                  { fieldName: "enddate", label: "End Date" },
                ],
              },
            ],
          },
        });
        const initialGeoJSON = {
          type: "FeatureCollection",
          features: [],
        };

        const blob = new Blob([JSON.stringify(initialGeoJSON)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        fpLayer.current = new GeoJSONLayer({
          url,
          editingEnabled: true,
          title: "FP Layer",
          geometryType: "point",
          fields: [
            { name: "comment", type: "string", alias: "Comment" },
            { name: "title", type: "string", alias: "Title" },
            { name: "image", type: "string", alias: "Image URL" },
            { name: "direction", type: "double", alias: "Direction" },
            { name: "photoId", type: "string", alias: "Photo ID" },
          ],
          renderer: {
            type: "unique-value",
            valueExpression: `
  IIF(
    IsEmpty($feature.direction) || $feature.direction == null,
    'no-dir',
    'has-dir'
  )
`,
            uniqueValueInfos: [
              {
                value: "has-dir",
                symbol: {
                  type: "picture-marker",
                  width: "40px",
                  height: "40px",
                  url: fpArrow,
                },
              },
              {
                value: "no-dir",
                symbol: {
                  type: "simple-marker",
                  style: "circle",
                  color: [0, 122, 194],
                  size: 6,
                  outline: {
                    color: [0, 122, 194],
                    width: 1,
                  },
                },
              },
            ],
            visualVariables: [
              {
                type: "rotation",
                field: "direction",
                rotationType: "geographic",
                valueUnit: "degrees",
              },
            ],
          },
          popupTemplate: {
            title: "Captured Image",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "comment", label: "Comment" },
                  { fieldName: "direction", label: "Direction" },
                ],
              },
              {
                type: "media",
                mediaInfos: [
                  {
                    title: "{title}",
                    type: "image",
                    value: {
                      sourceURL: "{image}",
                    },
                  },
                ],
              },
            ],
          },
        });

        apLayer.current = geojsonlayer;
        if (geojsonlayer && viewRef.current) {
          const layerList = new LayerList({
            view: viewRef.current,
          });
          const expandList = new Expand({
            content: layerList,
            view: viewRef.current,
          });
          viewRef.current.ui.add(expandList, "top-right");
        }
        geojsonlayer.queryFeatures().then((result) => {
          const features = result.features.map((feature) => {
            return {
              ...feature.attributes,
              geometry: feature.geometry,
            };
          });

          setApFeatures(features);
        });
        mapRef.current.add(geojsonlayer);
        mapRef.current.add(fpLayer.current);
      });
    }
    if (!cameraActive && viewRef.current)
      viewRef.current.container = "map-view";
  }, [cameraActive]);
  const openPopupForFeature = async (layer, title) => {
    // viewRef.current.zoom = 11;
    setPhotosActive(false);
    const result = await layer.queryFeatures({
      where: `title = '${title.replace(/'/g, "''")}'`,
      returnGeometry: true,
      outFields: ["*"],
    });
    if (result.features.length) {
      const feature = result.features[0];
      console.log(
        feature.attributes.title,
        feature.attributes.comment,
        feature.attributes[layer.objectIdField]
      );
      await viewRef.current.goTo(feature.geometry);
      if (layer.title === "FP Layer") {
        const popupContainer = document.createElement("div");
        createRoot(popupContainer).render(
          <CreateImagePopup
            imageUrl={feature.attributes.image}
            view={viewRef.current}
            layer={layer}
            id={feature.attributes[layer.objectIdField]}
            setFpFeatures={setFpFeatures}
            title={feature.attributes.title}
            comment={feature.attributes.comment}
            feature={feature}
            fpFeatures={fpFeatures}
          />
        );
        const popup = new Popup({
          title: "Captured Image",
          location: feature.geometry,
          content: popupContainer,
          dockEnabled: true,
          dockOptions: {
            buttonEnabled: true,
            breakpoint: false,
            position: "top-right",
          },
        });
        viewRef.current.popup.visibleElements = {
          ...viewRef.current.popup.visibleElements,
          closeButton: false,
        };
        viewRef.current.popup = popup;
        viewRef.current.openPopup();
      } else {
        viewRef.current.popup.visibleElements = {
          ...viewRef.current.popup.visibleElements,
          closeButton: true,
        };
        viewRef.current.openPopup({
          features: [feature],
          location: feature.geometry,
        });
      }
    }
  };
  return (
    <CalciteShell
      style={{ height: "100%", display: "flex", flexDirection: "column", position: 'fixed' }}
    >
      {!cameraActive ? (
        <>
          <div
            slot="header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ccc",
            }}
          >
            <h2>Agriculture Land</h2>
            <CalciteAvatar fullName="Ravi Kishan" scale="l"></CalciteAvatar>
          </div>

          <div style={{ flex: 1, display: "flex" }}>
            <CalciteShellPanel slot="panel-start" width>
              <CalcitePanel>
                <CalciteAction icon="home"></CalciteAction>
                <CalciteAction icon="home"></CalciteAction>
              </CalcitePanel>
            </CalciteShellPanel>
            <div style={{ flex: 1, display: "flex" }}>
              <div id="map-view" style={{ flex: 1 }}></div>
              {photosActive && (
                <CalciteShellPanel width="m">
                  <CalcitePanel heading="Photos">
                    <CalciteList>
                      <CalciteListItemGroup heading="List Required">
                        {apFeatures.length > 0 &&
                          apFeatures.map((feature) => (
                            <CalciteListItem
                              onCalciteListItemSelect={() =>
                                openPopupForFeature(
                                  apLayer.current,
                                  feature.title
                                )
                              }
                              key={feature.title}
                              label={feature.title}
                            />
                          ))}
                      </CalciteListItemGroup>
                      <CalciteListItemGroup heading="List Taken">
                        {fpFeatures.length > 0 &&
                          fpFeatures.map((feature) => (
                            <CalciteListItem
                              key={feature.id}
                              label={feature.title}
                              onCalciteListItemSelect={() =>
                                openPopupForFeature(
                                  fpLayer.current,
                                  feature.title
                                )
                              }
                            />
                          ))}
                      </CalciteListItemGroup>
                    </CalciteList>
                    <div slot="footer" style={{ display: "flex", gap: "10px" }}>
                      <CalciteButton
                        slot="footer"
                        onClick={() => setCameraActive(true)}
                      >
                        New
                      </CalciteButton>
                      <CalciteButton
                        slot="footer"
                        style={{
                          "--calcite-button-background-color": "#4CAF50",
                        }}
                        disabled={fpFeatures.length === 0}
                      >
                        Save to Portal
                      </CalciteButton>
                    </div>
                  </CalcitePanel>
                </CalciteShellPanel>
              )}
            </div>
            <CalciteShellPanel slot="panel-end" width>
              <CalciteAction
                icon="images"
                onClick={() => setPhotosActive((prev) => !prev)}
                active={photosActive}
              ></CalciteAction>
            </CalciteShellPanel>
          </div>
        </>
      ) : (
        <CaptureImage
          setCameraActive={setCameraActive}
          view={viewRef.current}
          layer={fpLayer.current}
          setFpFeatures={setFpFeatures}
          setPhotosActive={setPhotosActive}
          fpFeatures={fpFeatures}
        />
      )}
    </CalciteShell>
  );
}

export default App;
