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
import arrowIcon from "./assets/arrow.svg";
import CaptureImage from "./components/CaptureImage";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer.js";
import Expand from "@arcgis/core/widgets/Expand.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

function App() {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const apLayer = useRef(null);
  // const fpLayer = useRef(null);

  const [photosActive, setPhotosActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [apFeatures, setApFeatures] = useState([]);

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
            url: arrowIcon,
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
        });
        apLayer.current = geojsonlayer;
        const graphicLayer = new GraphicLayer({title: "graphicsLayer"});
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
          const graphics = [];
          features.forEach((feature) => {
            const symbol = new SimpleMarkerSymbol({
              style: "circle",
              color: "red",
              size: 4,
              outline: {
                color: "red",
                width: 1,
              },
            });
            const graphic = new Graphic({
              geometry: feature.geometry,
              symbol: symbol,
            });
            graphics.push(graphic);
          })
          graphicLayer.addMany(graphics);
          setApFeatures(features);
        });
        mapRef.current.add(geojsonlayer);
        mapRef.current.add(graphicLayer);
      });
    }
    if (!cameraActive && viewRef.current)
      viewRef.current.container = "map-view";
  }, [cameraActive]);
  return (
    <CalciteShell
      style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow-y: "auto" }}
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

            <div id="map-view" style={{ flex: 1 }}></div>
            {photosActive && (
              <CalciteShellPanel width="m">
                <CalcitePanel heading="Photos">
                  <CalciteList>
                    <CalciteListItemGroup heading="List Required">
                      {apFeatures.length > 0 &&
                        apFeatures.map((feature) => (
                          <CalciteListItem
                            key={feature.title}
                            label={feature.title}
                          />
                        ))}
                    </CalciteListItemGroup>
                    <CalciteListItemGroup heading="List Taken">
                      <CalciteListItem label="Hello 2" />
                    </CalciteListItemGroup>
                  </CalciteList>
                  <CalciteButton
                    slot="footer"
                    onClick={() => setCameraActive(true)}
                  >
                    New
                  </CalciteButton>
                </CalcitePanel>
              </CalciteShellPanel>
            )}
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
        />
      )}
    </CalciteShell>
  );
}

export default App;
