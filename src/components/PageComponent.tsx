import { FC, ReactNode } from "react";
import { Footer, FooterProps } from "./Footer/Footer";
import { Header, HeaderProps } from "./Header/Header";

interface PageComponentProps {
    children?: ReactNode,
    headerProps?: HeaderProps,
    footerProps?: FooterProps,
}

export const PageComponent: FC<PageComponentProps> = ({ children, footerProps = {}, headerProps = {} }) => (
    <div className="PageComponent">
        <Header {...headerProps} />
        <div className="PageComponent-body">
            {children}
        </div>
        <Footer {...footerProps} />
    </div>
)
