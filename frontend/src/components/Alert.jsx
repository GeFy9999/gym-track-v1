export function Alert({ message }) {
  return (
    <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
      <span>{message}</span>
    </div>
  );
}
