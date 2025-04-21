import Graphic from "@arcgis/core/Graphic";
import {
  CalciteButton,
  CalciteInput,
  CalciteLabel,
} from "@esri/calcite-components-react";
import Circle from "@arcgis/core/geometry/Circle.js";
import { useEffect, useRef, useState } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as containsOperator from "@arcgis/core/geometry/operators/containsOperator.js";
import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator.js";
import { createRoot } from "react-dom/client";
import CreateAlert from "./CreateAlert";

const CreateImagePopup = ({
  imageUrl,
  view,
  layer,
  id,
  setFpFeatures,
  title,
  comment,
  feature,
}) => {
  const clickHandlerRef = useRef(null);

  const [imageData, setImageData] = useState({
    title: title ? title : "Image_1",
    comment: comment ? comment : "This is image_1",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [modifyLocation, setModifyLocation] = useState(false);

  // const graphicLayer = useRef(null);
  useEffect(() => {
    projectOperator.load();
    // graphicLayer.current = new GraphicsLayer({ title: "Temporary Layer" });
    // view.map.add(graphicLayer.current);
  }, [view]);
  const handleImageDataChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") {
      setIsInvalid(value.trim() === "");
    }
    setImageData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setFpFeatures((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === id);

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title: imageData.title,
        };
        return updated;
      } else {
        return [...prev, { id: id, title: imageData.title }];
      }
    });
    const newGraphic = new Graphic({
      attributes: {
        comment: imageData.comment,
        title: imageData.title,
        [layer.objectIdField]: id,
      },
    });
    layer
      .applyEdits({
        updateFeatures: [newGraphic],
      })
      .then((result) => {
        console.log("Updated feature with ID:", id, result);
        view.popup.close();
      })
      .catch((error) => {
        console.error("Error updating feature:", error);
      });
  };
  const scrollContainerRef = useRef(null);

  const saveNewLocation = (updatedGraphic) => {
    layer
      .applyEdits({
        updateFeatures: [updatedGraphic],
      })
      .then((result) => {
        console.log("geometry updated successfully.", result);
        view.graphics.removeAll();
        // graphicLayer.current.removeAll();
      })
      .catch((error) => {
        console.error("Error updating feature:", error);
      });
  };
  // const handleSetDirection = (currPoint, newDirection) => {
  //   const initialDirection = currPoint.attributes.direction;

  // }

  const handleModifyLocation = () => {
    if (modifyLocation) {
      // Remove the previous click handler
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove();
        clickHandlerRef.current = null;
      }
      view.graphics.removeAll();
      view.container.style.cursor = "auto";
      setModifyLocation(false);
      return;
    }

    view.container.style.cursor = "crosshair";
    view.zoom = 18;

    const circleGeometry = new Circle({
      center: feature.geometry,
      radius: 50,
      radiusUnit: "meters",
      geodesic: true,
    });

    const circleGraphic = new Graphic({
      geometry: circleGeometry,
      symbol: {
        type: "simple-fill",
        color: [0, 0, 255, 0.1],
        outline: {
          color: [0, 0, 255, 1],
          width: 2,
        },
      },
    });

    view.graphics.add(circleGraphic);
    setModifyLocation(true);

    clickHandlerRef.current = view.on("click", (event) => {
      const newGraphic = new Graphic({
        geometry: event.mapPoint,
        symbol: {
          type: "simple-marker",
          color: [255, 0, 0],
          size: 6,
          outline: {
            color: [255, 0, 0],
            width: 2,
          },
        },
        attributes: {
          [layer.objectIdField]: id,
        },
      });

      const projectedCircle = projectOperator.execute(
        circleGeometry,
        event.mapPoint.spatialReference
      );

      if (containsOperator.execute(projectedCircle, event.mapPoint)) {
        saveNewLocation(newGraphic);
      } else {
        let dialog = document.createElement("calcite-dialog");
        dialog.open = true;
        dialog.modal = true;
        dialog.kind = "danger";
        document.body.appendChild(dialog);

        const closeDialog = () => {
          if (dialog) dialog.remove();
        };
        createRoot(dialog).render(<CreateAlert closeDialog={closeDialog} />);
        view.graphics.removeAll();
      }
        handleSave();

      // Clean up
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove();
        clickHandlerRef.current = null;
      }
      view.container.style.cursor = "auto";
      setModifyLocation(false);
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "10px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", gap: "10px" }}>
        <CalciteButton
          style={{
            width: "100%",
          }}
          onClick={handleModifyLocation}
          appearance={modifyLocation ? "outline-fill" : "solid"}
          kind={modifyLocation ? "danger" : "brand"}
          scale="m"
          iconStart="pin"
        >
          {!modifyLocation ? "Modify Location" : "Cancel"}
        </CalciteButton>

        <CalciteButton
          // onClick={handleModifyDirection}
          appearance="solid"
          scale="m"
          iconStart="compass"
          style={{
            "--calcite-button-background-color": "rgb(87, 90, 88)",
            width: "100%",
          }}
        >
          Set Direction
        </CalciteButton>
      </div>

      <div
        style={{
          opacity: confirmDelete ? 0.4 : 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: "10px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>Title</span>
          <CalciteInput
            disabled={confirmDelete}
            placeholder="Enter the title"
            name="title"
            value={imageData.title}
            onCalciteInputInput={handleImageDataChange}
          ></CalciteInput>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>Comment</span>
          <CalciteInput
            disabled={confirmDelete}
            name="comment"
            placeholder="Enter the comment"
            value={imageData.comment}
            onCalciteInputInput={handleImageDataChange}
          ></CalciteInput>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>
            Captured Image
          </span>
          <img src={imageUrl} alt="image" />
        </div>
      </div>
      {confirmDelete ? (
        <CalciteNotice
          kind="danger"
          open
          style={{ position: "sticky", bottom: "12px" }}
        >
          <CalciteLabel slot="title" style={{ fontWeight: "normal" }} scale="l">
            Are you sure you want to delete this item ? This action cannot be
            undone.
          </CalciteLabel>
          <div slot="message" style={{ display: "flex", gap: "10px" }}>
            <CalciteButton
              slot="secondary"
              width="full"
              appearance="outline"
              onClick={() => {
                setConfirmDelete(false);
              }}
            >
              Cancel
            </CalciteButton>
            <CalciteButton
              slot="primary"
              width="full"
              kind="danger"
              onClick={() => {
                layer
                  .applyEdits({
                    deleteFeatures: [{ objectId: id }],
                  })
                  .then((result) => {
                    setFpFeatures((prev) =>
                      prev.filter((item) => item.id !== id)
                    );
                    console.log("Deleted feature with ID:", id, result);
                    view.popup.close();
                    // view.zoom = 11;
                  })
                  .catch((error) => {
                    console.error("Error deleting feature:", error);
                  });
              }}
            >
              Delete
            </CalciteButton>
          </div>
        </CalciteNotice>
      ) : (
        <div style={{ display: "flex", gap: "5px" }}>
          <CalciteButton
            style={{ marginTop: "15px", width: "100%" }}
            onClick={handleSave}
            disabled={isInvalid}
          >
            {title ? "Update" : "Save"}
          </CalciteButton>
          <CalciteButton
            style={{
              marginTop: "15px",
              width: "100%",
              // "--CalciteButton-background-color": "#f44336",
            }}
            slot="secondary"
            width="full"
            kind="danger"
            appearance="outline"
            onClick={() => {
              setConfirmDelete(true);
              scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: "smooth",
              });
            }}
          >
            Delete
          </CalciteButton>
        </div>
      )}
    </div>
  );
};
export default CreateImagePopup;
