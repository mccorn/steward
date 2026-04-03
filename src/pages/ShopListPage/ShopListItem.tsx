import { ReactNode, useCallback } from "react"
import "./ShopListItem.css"

type ShopListItemProps = {
    data: ShopListItemData,
    onRemove: ((label: string) => void),
    onUpdate: ((node: ShopListItemData) => void),
}

export type ShopListItemData = {
    label: string,
    id?: string | number,
    isHot?: boolean,
}

function ShopListItem({ data, onRemove, onUpdate }: ShopListItemProps) {
    return <div className="ShopListItem">
        <span>
            {data.label}
        </span>

        <div
            className={"ShopListItem__icon button " + (data.isHot ? "active" : "")}
            style={{ textAlign: "center" }}
            onClick={() => onUpdate({ ...data, isHot: data.isHot })}
        >
            🔥
        </div>
        <div style={{ textAlign: "center" }} onClick={() => onRemove(data.label)}>
            ❌
        </div>
    </div>
}

export default ShopListItem