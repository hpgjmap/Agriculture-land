import { CalciteButton, CalciteInput } from "@esri/calcite-components-react";

const CreateImagePopup = ({ imageUrl }) => {
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
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>Add Title:</span>
        <CalciteInput placeholder="Enter the title"></CalciteInput>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>
          Add a Comment:
        </span>
        <CalciteInput placeholder="Enter the comment"></CalciteInput>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>
          Captured Image:
        </span>
        <img src={imageUrl} alt="image" />
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        <CalciteButton style={{ marginTop: "15px", width: "100%" }}>
          Save
        </CalciteButton>
        <CalciteButton
          style={{
            marginTop: "15px",
            width: "100%",
            "--calcite-button-background-color": "#f44336",
          }}
          
        >
          Discard
        </CalciteButton>
      </div>
    </div>
  );
};
export default CreateImagePopup;
