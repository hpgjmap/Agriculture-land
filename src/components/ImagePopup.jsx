import Graphic from "@arcgis/core/Graphic";
import {
  CalciteAlert,
  CalciteButton,
  CalciteDialog,
  CalciteInput,
  CalciteLabel,
  CalciteModal,
  CalciteNotice,
  CalcitePopover,
} from "@esri/calcite-components-react";
import { useRef, useState } from "react";

const CreateImagePopup = ({
  imageUrl,
  view,
  layer,
  id,
  setFpFeatures,
  title,
  comment,
}) => {
  const [imageData, setImageData] = useState({
    title: title ? title : "Image_1",
    comment: comment ? comment : "This is image_1",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

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
          // onClick={handleModifyLocation}
          appearance="solid"
          color="blue"
          scale="m"
          iconStart="pin"
        >
          Modify Location
        </CalciteButton>

        <CalciteButton
          // onClick={handleModifyDirection}
          appearance="solid"
          color="yellow"
          scale="m"
          iconStart="compass"
        >
          Modify Direction
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
