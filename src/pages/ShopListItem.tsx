import { ReactNode } from "react"
import "./ShopListItem.css"

type ShopListItemProps = {
    data: ShopListItemData,
}

export type ShopListItemData = {
    label: ReactNode,
    id?: string | number,
}

function ShopListItem({ data }: ShopListItemProps) {
    return <div className="ShopListItem">
        <span>
            {data.label}
        </span>

        <div style={{ textAlign: "center" }}>
            ❌
        </div>
    </div>
}

export default ShopListItem