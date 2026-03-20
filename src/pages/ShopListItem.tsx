import { ReactNode, useCallback } from "react"
import "./ShopListItem.css"

type ShopListItemProps = {
    data: ShopListItemData,
    onRemove: ((label: string) => void),
}

export type ShopListItemData = {
    label: string,
    id?: string | number,
}

function ShopListItem({ data, onRemove }: ShopListItemProps) {
    return <div className="ShopListItem">
        <span>
            {data.label}
        </span>

        <div style={{ textAlign: "center" }} onClick={() => onRemove(data.label)}>
            ❌
        </div>
    </div>
}

export default ShopListItem