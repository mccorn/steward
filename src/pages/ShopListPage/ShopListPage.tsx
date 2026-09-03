import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useParams } from "react-router";
import type { ShopList } from "../../../shared/store";
import ShopListItem from "./ShopListItem";
import "./ShopListPage.css"
import { PageComponent } from "../../components/PageComponent";
import { useStore } from "../../context/StoreContext";
import { ROUTES } from "../../const/routes";

function NestedSection({ list }: { list: ShopList }) {
  const { store, dispatch } = useStore()
  const nested = store.lists.filter((child) => child.parentId === list.id && child.display === "nested")

  const handleRemove = useCallback((id: string) => {
    dispatch("item.delete", { listId: list.id, id })
  }, [dispatch, list.id])

  const handleUpdate = useCallback((id: string, isHot: boolean) => {
    dispatch("item.update", { listId: list.id, id, isHot })
  }, [dispatch, list.id])

  return (
    <section className="ShopListPage-nested">
      <h3>{list.name}</h3>
      {list.items.map((node) => (
        <ShopListItem key={node.id} data={node} onRemove={handleRemove} onUpdate={handleUpdate} />
      ))}
      {nested.map((child) => <NestedSection key={child.id} list={child} />)}
    </section>
  )
}

export function ShopListPage() {
  const { listId } = useParams()
  const { store, activeListId, setActiveListId, dispatch } = useStore()
  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentId = listId || activeListId
  const list = store.lists.find((entry) => entry.id === currentId)
  const nested = store.lists.filter((child) => child.parentId === currentId && child.display === "nested")
  const pageChildren = store.lists.filter((child) => child.parentId === currentId && child.display === "page")

  useEffect(() => {
    if (list) setActiveListId(list.id)
  }, [list, setActiveListId])

  const handleRemove = useCallback((id: string) => {
    if (!list) return
    dispatch("item.delete", { listId: list.id, id })
  }, [dispatch, list])

  const handleUpdate = useCallback((id: string, isHot: boolean) => {
    if (!list) return
    dispatch("item.update", { listId: list.id, id, isHot })
  }, [dispatch, list])

  const handleCreate = useCallback(() => {
    if (!list) return
    const value = (inputRef.current?.value || "").trim();
    if (!value) return;
    dispatch("item.create", { listId: list.id, label: value })
    if (inputRef.current) inputRef.current.value = "";
  }, [dispatch, list])

  const footerChildren = useMemo(() => <div className="ShopListPage-Footer">
    <input ref={inputRef} onKeyDown={(event) => { if (event.key === "Enter") handleCreate() }}></input>
    <div className="button" onClick={handleCreate} style={{ width: 50, height: 40 }}>➕️</div>
  </div>, [handleCreate])

  if (!listId) {
    const fallback = (activeListId && store.lists.some((entry) => entry.id === activeListId))
      ? activeListId
      : store.lists[0]?.id
    if (fallback) {
      return <Navigate to={ROUTES.listPage.url(fallback)} replace />
    }
    return (
      <PageComponent footerProps={{ children: footerChildren }}>
        <div className="ShopListPage">Список пуст</div>
      </PageComponent>
    )
  }

  if (!list) {
    const fallback = (activeListId && store.lists.some((entry) => entry.id === activeListId))
      ? activeListId
      : store.lists[0]?.id
    if (fallback) {
      return <Navigate to={ROUTES.listPage.url(fallback)} replace />
    }
    return (
      <PageComponent footerProps={{ children: footerChildren }}>
        <div className="ShopListPage">Список не найден</div>
      </PageComponent>
    )
  }

  return (
    <PageComponent footerProps={{ children: footerChildren }} headerProps={{ title: list.name }}>
      <div className="ShopListPage">
        {list.items.length === 0 && nested.length === 0 && (
          <div className="ShopListPage-empty">Список пуст</div>
        )}
        {list.items.map((node) => (
          <ShopListItem key={node.id} data={node} onRemove={handleRemove} onUpdate={handleUpdate} />
        ))}
        {nested.map((child) => <NestedSection key={child.id} list={child} />)}
        {pageChildren.map((child) => (
          <Link key={child.id} className="ShopListPage-childLink" to={ROUTES.listPage.url(child.id)}>
            {child.name} →
          </Link>
        ))}
      </div>
    </PageComponent>
  )
}
