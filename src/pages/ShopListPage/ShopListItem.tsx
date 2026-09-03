import { memo } from "react"
import "./ShopListItem.css"

type ShopListItemProps = {
    data: ShopListItemData,
    onRemove: (id: string) => void,
    onUpdate: (id: string, isHot: boolean) => void,
}

export type ShopListItemData = {
    label: string,
    id: string,
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
            onClick={() => onUpdate(data.id, !data.isHot)}
        >
            🔥
        </div>
        <div className="button" style={{ textAlign: "center" }} onClick={() => onRemove(data.id)}>
            ❌
        </div>
    </div>
}

const MemoShopListItem = memo(ShopListItem)
MemoShopListItem.displayName = "ShopListItem"
export default MemoShopListItem
