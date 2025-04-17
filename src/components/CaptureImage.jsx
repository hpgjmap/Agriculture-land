import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import Point from "@arcgis/core/geometry/Point";
import React, { useEffect, useRef, useState } from "react";
import { CalciteButton } from "@esri/calcite-components-react";
import { createRoot } from "react-dom/client";
import Popup from "@arcgis/core/widgets/Popup.js";
import CreateImagePopup from "./ImagePopup";
import close from "../assets/close.svg";
const CaptureImage = ({ setCameraActive, view }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const stream = useRef(null);

  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const startCapturing = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported on this device/browser.");
        return;
      }

      try {
        stream.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // rear camera on phone
        });
        video.srcObject = stream.current;
      } catch (err) {
        alert(
          "Could not access the camera. Permission denied or device issue."
        );
        console.error(err);
      }
    };
    startCapturing();
    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!stream.current) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    if (stream.current) {
      stream.current.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      stream.current = null;
    }
    setCaptured(true);
  };

  const createFPLayer = (geoJSON) => {
    const blob = new Blob([JSON.stringify(geoJSON)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const newFPLayer = new GeoJSONLayer({
      url,
      title: "FP Layer",
      popupTemplate: {
        title: "Image_1",
        content: [
          {
            type: "media",
            mediaInfos: [
              {
                // title: "Captured Image",
                caption: "{comment}",
                type: "image",
                value: {
                  sourceURL: "{image}",
                  altText: "{comment}",
                  imageData: "{image}",
                },
              },
            ],
          },
        ],
      },
    });
    view.map.add(newFPLayer);
    console.log(geoJSON);
  };

  const handleSavingImageAndLocation = async () => {
    if (!canvasRef.current) {
      console.warn("Canvas not ready");
      return;
    }
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 1);
    let heading = null;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const geoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                comment: "",
                image: dataUrl,
                direction: heading,
                photoId: "",
              },
              geometry: {
                type: "Point",
                coordinates: [
                  position.coords.longitude,
                  position.coords.latitude,
                ],
              },
            },
          ],
        };
        view
          .goTo(
            new Point({
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
            })
          )
          .then(() => {
            const popupContainer = document.createElement("div");

            createRoot(popupContainer).render(
              <CreateImagePopup imageUrl={dataUrl} />
            );
            const popup = new Popup({
              title: "Captured Image",
              location: geoJSON.features[0].geometry,
              content: popupContainer,
              dockEnabled: true,
              dockOptions: {
                buttonEnabled: true,
                breakpoint: false,
                position: "top-right",
              },
            });
            view.popup = popup;
            view.openPopup();
          });
        createFPLayer(geoJSON);
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
    setCameraActive(false);
  };
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: captured ? "block" : "none",
          objectFit: "cover",
        }}
      ></canvas>

      <video
        id="video"
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: captured ? "none" : "block",
          objectFit: "cover",
        }}
      ></video>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "12px",
          fontSize: "16px",
          borderRadius: "100%",
          backdropFilter: "blur(10px)",
          cursor: "pointer",
          background: "rgba(255, 255, 255, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          setCameraActive(false);
          videoRef.current.srcObject = null;
          stream.current = null;
        }}
      >
        <img src={close} alt="close" width={20} height={20} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          padding: "16px",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
        }}
      >
        {captured ? (
          <CalciteButton scale="l" onClick={handleCapture}>
            Recapture
          </CalciteButton>
        ) : (
          <CalciteButton scale="l" onClick={handleCapture}>
            Capture
          </CalciteButton>
        )}

        {captured && (
          <CalciteButton
            scale="l"
            style={{
              "--calcite-button-background-color": "#4CAF50",
            }}
            onClick={handleSavingImageAndLocation}
          >
            Done
          </CalciteButton>
        )}
      </div>
    </div>
  );
};

export default CaptureImage;
