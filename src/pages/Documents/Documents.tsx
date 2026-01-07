import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, http } from "../../api/http";
import {
  documentsClient,
  type IngestRequest,
  type IngestResponse,
} from "../../api/documentsClient";

type DocListItem = {
  id: string;
  fileName: string;
  source?: string;
  originalLength: number;
  createdUtc: string;
};

export const DocumentsPage: React.FC = () => {
  const qc = useQueryClient();

  // Tenant-ready (server defaults to "dev" if header missing)
  const [tenantId, setTenantId] = useState("dev");

  // Ingest form
  const [fileName, setFileName] = useState("notes.txt");
  const [contentType, setContentType] = useState("text/plain");
  const [source, setSource] = useState("manual");
  const [text, setText] = useState(
    `This is a basic test paragraph. It contains short sentences and common words. It is useful for checking font size, line height, and readability on screen.

Sometimes you need a paragraph that feels more “real” than placeholder text. This one is meant for testing how your layout handles normal content, including commas, apostrophes, and a mix of short and long words.

When paragraphs get longer, you start noticing issues like awkward line breaks, tight spacing, or uneven margins. This paragraph is intentionally extended to help you test text wrapping across different screen sizes, zoom levels, and responsive containers.

Order #A-10293 was updated on 06/01/2026 at 10:45 PM. Total: ₹12,850.75 (including tax). Status changed from “Pending” to “Approved” — please re-check the confirmation email.

We couldn’t complete your request right now. Please check your internet connection and try again. If the problem continues, contact support with the error code shown below.`
  );

  const canIngest = fileName.trim().length > 0 && text.trim().length > 0;

  const listQuery = useQuery({
    queryKey: ["documents", tenantId],
    queryFn: () =>
      http<DocListItem[]>("/api/documents", {
        headers: { "X-Tenant-Id": tenantId },
      }),
    refetchOnWindowFocus: false,
  });

  const ingest = useMutation<IngestResponse, ApiError, IngestRequest>({
    mutationFn: (req) => documentsClient.ingest(req),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents", tenantId] });
    },
  });

  const ingestError = ingest.error as ApiError | undefined;

  const errorLines = useMemo(() => {
    const errs = ingestError?.problem?.errors;
    if (!errs) return [];
    const lines: string[] = [];
    for (const [field, messages] of Object.entries(errs)) {
      for (const m of messages) lines.push(`${field}: ${m}`);
    }
    return lines;
  }, [ingestError]);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui" }}>
      <h1>Documents</h1>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
          maxWidth: 900,
        }}
      >
        <h3>Ingest (text)</h3>

        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
          }}
        >
          <label style={labelStyle}>
            Tenant
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="dev"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            File Name
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="notes.txt"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Content Type
            <input
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              placeholder="text/plain"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Source
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="manual"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: 10 }}>
          Text
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ ...inputStyle, width: "100%", resize: "vertical" }}
          />
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <button
            onClick={() =>
              ingest.mutate({
                fileName: fileName.trim(),
                contentType: contentType.trim() || undefined,
                source: source.trim() || undefined,
                text,
              })
            }
            disabled={!canIngest || ingest.isPending}
            style={buttonStyle}
          >
            {ingest.isPending ? "Ingesting…" : "Ingest"}
          </button>

          <button
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
            style={secondaryButtonStyle}
          >
            {listQuery.isFetching ? "Refreshing…" : "Refresh list"}
          </button>

          <span style={{ marginLeft: "auto", color: "#666" }}>
            {listQuery.data ? `Docs: ${listQuery.data.length}` : ""}
          </span>
        </div>

        {ingest.isSuccess && ingest.data && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: "1px solid #cce7cc",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "green", fontWeight: 600 }}>
              Ingested successfully
            </div>
            <div style={{ marginTop: 6 }}>
              <div>
                <strong>DocumentId:</strong> {ingest.data.documentId}
              </div>
              <div>
                <strong>ChunkCount:</strong> {ingest.data.chunkCount} |{" "}
                <strong>OriginalLength:</strong> {ingest.data.originalLength}
              </div>
              <div>
                <strong>Tenant:</strong> {ingest.data.tenantId}
              </div>
            </div>
          </div>
        )}

        {ingest.isError && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: "1px solid #f2b8b5",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "red", fontWeight: 600 }}>
              {ingestError?.message ?? "Ingest failed"}
            </div>

            {errorLines.length > 0 && (
              <ul style={{ marginTop: 6, color: "red" }}>
                {errorLines.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 18 }}>Recent documents</h2>

      {listQuery.isLoading && <p>Loading…</p>}
      {listQuery.isError && (
        <p style={{ color: "red" }}>
          Error: {(listQuery.error as Error).message}
        </p>
      )}

      {listQuery.data && (
        <table
          style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}
        >
          <thead>
            <tr>
              <th style={th}>File Name</th>
              <th style={th}>Source</th>
              <th style={th}>Length</th>
              <th style={th}>Created (UTC)</th>
              <th style={th}>Id</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.data.map((d) => (
              <tr key={d.id}>
                <td style={td}>{d.fileName}</td>
                <td style={td}>{d.source ?? "-"}</td>
                <td style={td}>{d.originalLength}</td>
                <td style={td}>{new Date(d.createdUtc).toISOString()}</td>
                <td style={td}>
                  <code style={{ fontSize: 12 }}>{d.id}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 10, color: "#666", maxWidth: 900 }}>
        Note: This page sends <code>X-Tenant-Id</code> header. If you keep it as{" "}
        <code>dev</code>, all docs are stored under that tenant. Later (Week 3),
        we’ll connect tenant to auth/claims.
      </p>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #333",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #999",
  cursor: "pointer",
};

const th: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 10px",
  textAlign: "left",
};
const td: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 10px",
};
