import { CalciteIcon } from "@esri/calcite-components-react";
const CreateAlert = ({ closeDialog }) => {
  return (
    <div
      slot="content"
      style={{
        display: "flex",
        background: "white",
        padding: "5px 0px 5px 20px",
        height: "100px",
        justifyContent: "space-between",
      }}
    >
      <p style={{ fontWeight: 500, fontSize: "18px" }}>
        Modified point must be within the circle.
        <p
          style={{
            fontSize: "14px",
            fontWeight: "normal",
            color: "rgb(83, 83, 83)",
          }}
        >
          The circle is of radius 50 meters.
        </p>
      </p>
      <div
        style={{
          cursor: "pointer",
          height: "100%",
          width: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={closeDialog}
      >
        <CalciteIcon icon="x"></CalciteIcon>
      </div>
    </div>
  );
};

export default CreateAlert;
