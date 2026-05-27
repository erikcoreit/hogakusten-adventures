import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdventureEditor } from "@/components/adventure-editor";

export const Route = createFileRoute("/_authenticated/redigera/$id")({ component: Edit });

function Edit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return <AdventureEditor id={id} onDone={() => navigate({ to: "/mina-aventyr" })} />;
}
