import { FC, ReactNode } from "react";
import "./Footer.css";

export interface FooterProps {
    children?: ReactNode,
}

export const Footer: FC<FooterProps> = ({ children }) => (
    <div className="Footer">{children}</div>
)
