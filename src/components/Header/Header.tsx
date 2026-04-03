import { FC, ReactNode } from "react";
import "./Header.css";

export interface HeaderProps {
    children?: ReactNode,
}

export const Header: FC<HeaderProps> = ({ children }) => <div className="Header">
    Header
    {children}
</div>