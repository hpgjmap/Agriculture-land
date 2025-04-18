import Graphic from "@arcgis/core/Graphic";
import { CalciteButton, CalciteInput } from "@esri/calcite-components-react";
import { useState } from "react";

const CreateImagePopup = ({
  imageUrl,
  view,
  layer,
  id,
  setFpFeatures,
  title,
  comment,
  direction
}) => {
  const [imageData, setImageData] = useState({
    title: title ? title : "",
    comment: comment ? comment : "",
  });
  const handleImageDataChange = (e) =>
    setImageData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSave = () => {
    setFpFeatures((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === id);

      if (existingIndex !== -1) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title: imageData.title,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { id: id, title: imageData.title }];
      }
    });
    console.log(imageData);
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
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>Title</span>
        <CalciteInput
          placeholder="Enter the title"
          name="title"
          value={imageData.title}
          onCalciteInputChange={handleImageDataChange}
        ></CalciteInput>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>Comment</span>
        <CalciteInput
          name="comment"
          placeholder="Enter the comment"
          value={imageData.comment}
          onCalciteInputChange={handleImageDataChange}
        ></CalciteInput>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>
          Captured Image
        </span>
        <img src={imageUrl} alt="image" />
      </div>
      <div>
        direction is : {direction}
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        <CalciteButton
          style={{ marginTop: "15px", width: "100%" }}
          onClick={handleSave}
        >
          Save
        </CalciteButton>
        <CalciteButton
          style={{
            marginTop: "15px",
            width: "100%",
            "--calcite-button-background-color": "#f44336",
          }}
          onClick={() => {
            layer
              .applyEdits({
                deleteFeatures: [{ objectId: id }],
              })
              .then((result) => {
                setFpFeatures((prev) => prev.filter((item) => item.id !== id));
                console.log("Deleted feature with ID:", id, result);
                view.popup.close();
                // view.zoom = 11;
              })
              .catch((error) => {
                console.error("Error deleting feature:", error);
              });
          }}
        >
          Discard
        </CalciteButton>
      </div>
    </div>
  );
};
export default CreateImagePopup;
