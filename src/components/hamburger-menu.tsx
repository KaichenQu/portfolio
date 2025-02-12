"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/lib/types";
import clsx from "clsx";
import NextLink from "next/link";
import { useActiveSectionContext } from "@/containers/active-section";
import { Menu } from "lucide-react";
import Hamburger from "hamburger-react";

type HamburgerMenuProps = { links: Link[] };

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  const menuTrigger = {
    visible: { scale: 1, opacity: 0.7, y: 0 },
    tap: { scale: 0.85 },
    hover: { scale: 1.2 },
  };

  const menuList = {
    start: { scale: 0.6, opacity: 0.7, y: -20 },
    visible: { scale: 1, opacity: 0.9, y: 0 },
  };

  return (
    <div className="md:hidden top-5 right-5 fixed w-60 z-[999] flex flex-col items-end gap-2">
      <motion.button
        className="bg-white w-[3rem] h-[3rem] drop-shadow backdrop-blur-[0.5rem] border border-slate-400 dark:border-white border-opacity-40 shadow-2xl rounded-full flex items-center justify-center dark:bg-gray-950"
        variants={menuTrigger}
        initial="visible"
        whileTap="tap"
        whileHover="hover"
      >
        <Hamburger toggled={isOpen} toggle={setIsOpen} size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuList}
            initial="start"
            animate="visible"
            className="w-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:bg-gradient-to-b dark:from-gray-900/90 dark:to-gray-800/90 rounded-2xl flex flex-col items-center justify-center dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 ease-out p-1.5"
          >
            {links.map((link, index) => (
              <motion.div
                className="w-full"
                key={link.hash}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <NextLink
                  className={clsx(
                    "flex w-full items-center justify-center px-3 py-3 hover:text-gray-950 transition dark:text-white/60 dark:hover:text-gray-200 cursor-pointer",
                    {
                      "text-gray-950 bg-slate-200 dark:text-gray-200 dark:bg-gray-700 rounded":
                        activeSection === link.hash,
                      "rounded-t-xl round": index === 0,
                      "rounded-b-xl round": index === links.length - 1,
                    }
                  )}
                  href={link.hash}
                  onClick={() => {
                    setActiveSection(link.hash);
                    setTimeOfLastClick(Date.now());
                  }}
                >
                  {link.nameEng}
                </NextLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HamburgerMenu;
