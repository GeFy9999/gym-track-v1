import { useState } from "react";

export function Header() {
  const [titleName, setTitleName] = useState<string>("Gym Tracker");

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
