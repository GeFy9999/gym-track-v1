import { useState } from "react";

export function Header() {
  const [titleName, setTitleName] = useState("Gym Tracker");

  return (
    <>
      <header>{titleName}</header>
      <input
        type="text"
        placeholder="title"
        value={titleName}
        onChange={(e) => setTitleName(e.target.value)}
      />
    </>
  );
}
