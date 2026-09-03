import { ChangeEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { listDepth } from "../../../shared/store.mjs";
import { useNetwork } from "../../context/NetworkContext";
import { useStore } from "../../context/StoreContext";
import { ROUTES } from "../../const/routes";
import "./Header.css";

export interface HeaderProps {
    title?: string,
}

function networkLabel(reachable: boolean, queueLength: number): { text: string, className: string } {
    if (!reachable) return { text: "оффлайн", className: "offline" }
    if (queueLength > 0) return { text: "синхронизация", className: "syncing" }
    return { text: "онлайн", className: "online" }
}

export function Header({ title }: HeaderProps) {
    const { store, activeListId, setActiveListId, queueLength } = useStore()
    const { reachable } = useNetwork()
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()
    const selectedId = store.lists.some((list) => list.id === (params.listId || activeListId))
        ? (params.listId || activeListId || "")
        : (store.lists[0]?.id || "")
    const status = networkLabel(reachable, queueLength)

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const id = event.target.value
        if (!id) return
        setActiveListId(id)
        navigate(ROUTES.listPage.url(id))
    }

    return (
        <div className="Header">
            <span className="Header-title">{title || "Steward"}</span>
            <select className="Header-select" value={selectedId} onChange={handleChange}>
                {store.lists.map((list) => (
                    <option key={list.id} value={list.id}>
                        {"—".repeat(listDepth(store, list.id))}{listDepth(store, list.id) ? " " : ""}{list.name}
                    </option>
                ))}
            </select>
            <span className={`Header-status Header-status--${status.className}`}>{status.text}</span>
            {selectedId && !location.pathname.endsWith("/settings") && selectedId !== "new" && (
                <Link className="Header-link" to={ROUTES.listSettings.url(selectedId)}>настройки</Link>
            )}
            <Link className="Header-link" to={ROUTES.listNew.url}>+</Link>
        </div>
    )
}
