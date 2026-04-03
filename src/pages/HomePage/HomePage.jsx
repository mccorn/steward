import { Link } from "react-router";
import { ROUTES } from "../../const/routes";

export const HomePage = () => <>
    <div>
        <ul>
            <li><Link to={ROUTES.shopListPage.url} />Список покупок</li>
            <li><Link to={ROUTES.reputationPage.url} />Репутация</li>
        </ul>
    </div>
</>