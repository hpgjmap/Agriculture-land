import { CalciteIcon } from "@esri/calcite-components-react";
const CreateAlert = ({closeDialog}) => {
  return (
    <div
      slot="content"
      style={{
        display: "flex",
        background: "white",
        padding: "5px 20px",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <p style={{ fontWeight: 500 }}>
        Modified point must be within the circle.
      </p>
      <CalciteIcon icon="x" style={{cursor: 'pointer'}}  onClick={closeDialog}></CalciteIcon>
    </div>
  );
};

export default CreateAlert;
