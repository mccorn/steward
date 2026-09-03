import { FormEvent, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { PageComponent } from "../../components/PageComponent"
import { useStore } from "../../context/StoreContext"
import { ROUTES } from "../../const/routes"
import type { ListDisplay } from "../../../shared/store"
import "./ListSettingsPage.css"

type ListSettingsPageProps = {
  mode?: "create" | "edit"
}

export function ListSettingsPage({ mode = "edit" }: ListSettingsPageProps) {
  const { listId } = useParams()
  const isCreate = mode === "create"
  const { store, dispatch, setActiveListId } = useStore()
  const navigate = useNavigate()
  const current = store.lists.find((list) => list.id === listId)

  const [name, setName] = useState(isCreate ? "" : (current?.name || ""))
  const [parentId, setParentId] = useState<string>(isCreate ? "" : (current?.parentId || ""))
  const [display, setDisplay] = useState<ListDisplay>(isCreate ? "page" : (current?.display || "page"))
  const [error, setError] = useState("")

  const parentOptions = useMemo(() => {
    if (isCreate) return store.lists
    return store.lists.filter((list) => list.id !== listId)
  }, [isCreate, listId, store.lists])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError("")
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Нужно имя списка")
      return
    }

    if (isCreate) {
      const previousIds = new Set(store.lists.map((list) => list.id))
      const next = dispatch("list.create", {
        name: trimmed,
        parentId: parentId || null,
        display,
      })
      if (!next) {
        setError("Не удалось создать список")
        return
      }
      const created = next.lists.find((list) => !previousIds.has(list.id))
      if (created) {
        setActiveListId(created.id)
        navigate(ROUTES.listPage.url(created.id))
      }
      return
    }

    const next = dispatch("list.update", {
      id: listId,
      name: trimmed,
      parentId: parentId || null,
      display,
    })
    if (!next) {
        setError("Не удалось сохранить. Нужен родитель для вложенного блока, циклы запрещены.")
      return
    }
    navigate(ROUTES.listPage.url(listId!))
  }

  const handleDelete = () => {
    if (!listId) return
    const next = dispatch("list.delete", { id: listId })
    if (!next) {
      setError("Нельзя удалить: есть вложенные списки или это последний список")
      return
    }
    const fallback = next.lists[0]
    if (fallback) {
      setActiveListId(fallback.id)
      navigate(ROUTES.listPage.url(fallback.id))
    }
  }

  if (!isCreate && !current) {
    return (
      <PageComponent headerProps={{ title: "Настройки" }}>
        <div>Список не найден</div>
      </PageComponent>
    )
  }

  return (
    <PageComponent headerProps={{ title: isCreate ? "Новый список" : "Настройки" }}>
      <form className="ListSettingsPage" onSubmit={handleSubmit}>
        <label>
          Имя
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Родитель
          <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">Нет (корневой)</option>
            {parentOptions.map((list) => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Как показывать</legend>
          <label>
            <input
              type="radio"
              name="display"
              checked={display === "page"}
              onChange={() => setDisplay("page")}
            />
            Отдельная страница
          </label>
          <label>
            <input
              type="radio"
              name="display"
              checked={display === "nested"}
              onChange={() => setDisplay("nested")}
            />
            Вложенный блок на странице родителя
          </label>
        </fieldset>
        {error && <div className="ListSettingsPage-error">{error}</div>}
        <button type="submit">{isCreate ? "Создать" : "Сохранить"}</button>
        {!isCreate && (
          <button type="button" className="ListSettingsPage-delete" onClick={handleDelete}>
            Удалить список
          </button>
        )}
      </form>
    </PageComponent>
  )
}
