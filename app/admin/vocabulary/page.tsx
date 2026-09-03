import { Tags } from "lucide-react";
import { VocabularyManager } from "@/components/admin/vocabulary-manager";
import { EmptyState, Panel } from "@/components/admin/ui";
import { listVocabularies } from "@/lib/admin/data";
import { PERMISSIONS, can, requirePermission } from "@/lib/admin/session";

export const metadata = { title: "Vocabulary" };

export default async function AdminVocabulary() {
  const user = await requirePermission(PERMISSIONS.vocabRead, "/admin/vocabulary");
  const vocabularies = await listVocabularies();

  const total = vocabularies.reduce((sum, group) => sum + group.terms.length, 0);

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow text-sky">Taxonomy</p>
        <h1 className="display mt-2 text-3xl leading-tight">Vocabulary</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          These terms are what the Explore filters offer, and the public API validates
          query parameters against them. Renaming one keeps the old value working;
          merging moves the records rather than stranding them.
        </p>
      </header>

      {total === 0 ? (
        <Panel as="div">
          <EmptyState
            icon={<Tags size={20} />}
            title="No vocabularies yet"
            description="Run the migrations to seed the seasons and times of day."
          />
        </Panel>
      ) : (
        <VocabularyManager
          vocabularies={vocabularies}
          editable={can(user, PERMISSIONS.vocabWrite)}
        />
      )}
    </div>
  );
}
