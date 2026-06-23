interface AlertProps {
  message: string;
}

export function Alert({ message }: AlertProps) {
  return (
    <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
      <span>{message}</span>
    </div>
  );
}
