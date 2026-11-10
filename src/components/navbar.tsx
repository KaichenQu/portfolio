import React from "react";
import HamburgerMenu from "./hamburger-menu";
import Header from "./header";
import { homeLink, links } from "@/lib/data";

const menuLinks = [homeLink, ...links];

export default function Navbar() {
  return (
    <>
      <HamburgerMenu links={menuLinks} />
      <Header links={menuLinks} />
    </>
  );
}
