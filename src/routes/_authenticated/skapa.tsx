import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdventureEditor } from "@/components/adventure-editor";

export const Route = createFileRoute("/_authenticated/skapa")({ component: Create });

function Create() {
  const navigate = useNavigate();
  return <AdventureEditor onDone={() => navigate({ to: "/mina-aventyr" })} />;
}
