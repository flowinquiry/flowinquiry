"use client";

import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import type { EditorView } from "@tiptap/pm/view";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

import { getSecureBlobResource } from "@/lib/actions/commons.action";
import { findUsersByTerm } from "@/lib/actions/users.action";
import { UserDTO } from "@/types/users";

interface RichTextEditorProps {
  value?: string | null;
  onChange?: (content: string) => void;
  onBlur?: () => void;
  inDialog?: boolean;
}

const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  inDialog = false,
}: RichTextEditorProps) => {
  // State for the inline mention suggestions
  const [mentionSuggestions, setMentionSuggestions] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);
  const isSelectingMention = useRef(false);

  // Function to fetch mention suggestions from API
  const loadMentionSuggestions = useCallback(
    async (query: string): Promise<UserDTO[]> => {
      setIsLoading(true);
      try {
        const users = await findUsersByTerm(query);
        const usersArray = Array.isArray(users)
          ? users
          : [users].filter(Boolean);
        setMentionSuggestions(usersArray);
        return usersArray;
      } catch (error) {
        console.error("Error fetching mention suggestions:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Function to calculate position for the popup - handles dialog positioning
  const calculatePopupPosition = useCallback(
    (clientRect: DOMRect, popup: HTMLElement) => {
      if (!editorContainerRef.current) return { top: 0, left: 0 };

      // Get editor container's position
      const editorRect = editorContainerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      // Calculate position relative to the editor container
      // rather than relative to the viewport
      let top = clientRect.bottom - editorRect.top;
      let left = clientRect.left - editorRect.left;

      // For dialogs, ensure positioning is relative to visible area
      if (inDialog) {
        // Find any scrollable parent (like a dialog content container)
        let scrollableParent = editorContainerRef.current.closest(
          '.dialog-content, [data-scrollable="true"]',
        );
        if (scrollableParent) {
          const parentRect = scrollableParent.getBoundingClientRect();
          const parentScroll = {
            top: scrollableParent.scrollTop,
            left: scrollableParent.scrollLeft,
          };

          // Adjust for parent's scroll position
          top = clientRect.bottom - parentRect.top + parentScroll.top;
          left = clientRect.left - parentRect.left + parentScroll.left;
        }
      }

      // Handle popup overflow
      const popupRect = popup.getBoundingClientRect();

      // Ensure the popup stays within the editor container
      const maxWidth = editorRect.width;
      if (left + popupRect.width > maxWidth) {
        left = maxWidth - popupRect.width;
      }
      if (left < 0) left = 0;

      return { top, left };
    },
    [inDialog],
  );

  // Initialize the editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border border-input w-full mb-4",
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Mention.configure({
        HTMLAttributes: {
          class:
            "inline-flex items-center bg-primary/10 text-primary px-1.5 py-0.5 rounded mr-1",
          spellcheck: "false",
        },
        renderHTML({ options, node }) {
          return [
            "span",
            {
              ...options.HTMLAttributes,
              "data-mention-id": node.attrs.id,
            },
            `@${node.attrs.label ?? node.attrs.id}`,
          ];
        },
        suggestion: {
          char: "@",
          // Inline rendering approach
          render: () => {
            return {
              onStart: (props: any) => {
                isSelectingMention.current = true;
                setSelectedIndex(0);

                // Create popup if it doesn't exist
                if (!popupRef.current) {
                  const popup = document.createElement("div");
                  popup.classList.add("mention-popup");
                  popup.setAttribute("data-mention-suggestions", "true");
                  popup.style.position = "absolute";
                  popup.style.zIndex = inDialog ? "10000" : "9999";
                  popup.style.backgroundColor = "var(--background)";
                  popup.style.borderRadius = "0.375rem";
                  popup.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                  popup.style.border = "1px solid var(--border)";
                  popup.style.overflow = "hidden";
                  popup.style.maxHeight = "15rem";
                  popup.style.width = "16rem";
                  popup.style.overflowY = "auto";

                  // Position is handled separately to account for dialog context
                  if (props.clientRect && editorContainerRef.current) {
                    const rect = props.clientRect();
                    const { top, left } = calculatePopupPosition(rect, popup);
                    popup.style.top = `${top}px`;
                    popup.style.left = `${left}px`;

                    // Add a tiny delay to ensure proper position calculation
                    setTimeout(() => {
                      const updatedPos = calculatePopupPosition(rect, popup);
                      popup.style.top = `${updatedPos.top}px`;
                      popup.style.left = `${updatedPos.left}px`;
                    }, 10);
                  }

                  // Add to editor container - this is key for dialog context
                  if (editorContainerRef.current) {
                    editorContainerRef.current.appendChild(popup);
                  }

                  popupRef.current = popup;
                }

                setShowMentionSuggestions(true);
                setMentionSuggestions(props.items);

                // Render to the popup
                renderSuggestions(
                  popupRef.current!,
                  props.items,
                  props.command,
                );
              },

              onUpdate: (props: any) => {
                if (!popupRef.current) return;

                // Update position
                if (props.clientRect && editorContainerRef.current) {
                  const rect = props.clientRect();
                  const { top, left } = calculatePopupPosition(
                    rect,
                    popupRef.current,
                  );
                  popupRef.current.style.top = `${top}px`;
                  popupRef.current.style.left = `${left}px`;
                }

                // Update suggestions
                setMentionSuggestions(props.items);
                renderSuggestions(popupRef.current, props.items, props.command);
              },

              onKeyDown: (props: any) => {
                if (!popupRef.current) return false;

                if (props.event.key === "ArrowDown") {
                  setSelectedIndex((prev) =>
                    Math.min(prev + 1, mentionSuggestions.length - 1),
                  );
                  updateSelectedItem();
                  return true;
                }

                if (props.event.key === "ArrowUp") {
                  setSelectedIndex((prev) => Math.max(prev - 1, 0));
                  updateSelectedItem();
                  return true;
                }

                if (props.event.key === "Enter") {
                  if (mentionSuggestions.length > 0 && selectedIndex >= 0) {
                    props.command(mentionSuggestions[selectedIndex]);
                    return true;
                  }
                }

                if (props.event.key === "Escape") {
                  cleanup();
                  return true;
                }

                return false;
              },

              onExit: () => {
                cleanup();
              },
            };

            // Helper to update selected item highlighting
            function updateSelectedItem() {
              if (!popupRef.current) return;

              const items = popupRef.current.querySelectorAll(".mention-item");
              items.forEach((item, i) => {
                if (i === selectedIndex) {
                  item.classList.add("bg-muted");
                } else {
                  item.classList.remove("bg-muted");
                }
              });
            }

            // Helper function to render suggestions
            function renderSuggestions(
              element: HTMLElement,
              items: UserDTO[],
              command: (user: UserDTO) => void,
            ) {
              if (isLoading) {
                element.innerHTML =
                  '<div class="p-2 text-sm text-muted-foreground">Loading...</div>';
                return;
              }

              if (items.length === 0) {
                element.innerHTML =
                  '<div class="p-2 text-sm text-muted-foreground">No users found</div>';
                return;
              }

              // Clear existing content
              element.innerHTML = "";

              // Create a container for the suggestions
              const container = document.createElement("div");
              container.className = "mention-suggestion-container";

              // Add each suggestion
              items.forEach((item, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `mention-item flex items-center w-full px-3 py-2 text-sm text-left hover:bg-muted ${
                  index === selectedIndex ? "bg-muted" : ""
                }`;
                button.setAttribute("data-mention-index", index.toString());

                // Create placeholder for avatar/initial
                const avatarContainer = document.createElement("div");
                avatarContainer.className =
                  "w-6 h-6 rounded-full mr-2 flex items-center justify-center";
                // Add the avatar or initial
                if (item.imageUrl) {
                  // Initially show initial while loading the secure image
                  avatarContainer.className =
                    "w-6 h-6 rounded-full mr-2 bg-primary/10 text-primary flex items-center justify-center";
                  avatarContainer.innerHTML = `<span>${item.firstName.charAt(0)}</span>`;

                  // Load secure image
                  const loadSecureImage = async () => {
                    try {
                      const blob = await getSecureBlobResource(item.imageUrl!);
                      if (blob) {
                        const objectURL = URL.createObjectURL(blob);

                        // Replace initial with actual image
                        avatarContainer.innerHTML = "";
                        avatarContainer.className = "w-6 h-6 rounded-full mr-2"; // Reset className

                        const img = document.createElement("img");
                        img.src = objectURL;
                        img.alt = `${item.firstName} ${item.lastName || ""}`;
                        img.className =
                          "w-full h-full rounded-full object-cover";

                        avatarContainer.appendChild(img);

                        // Clean up the object URL when no longer needed
                        button.addEventListener("remove", () => {
                          URL.revokeObjectURL(objectURL);
                        });
                      }
                    } catch (error) {
                      console.error("Error fetching protected image:", error);
                      // Keep showing initial on error
                    }
                  };

                  // Start loading the image
                  loadSecureImage();
                } else {
                  const initial = document.createElement("div");
                  initial.className =
                    "w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2";
                  initial.innerHTML = `<span>${item.firstName.charAt(0)}</span>`;
                  button.appendChild(initial);
                }

                // Add the name
                const name = document.createElement("span");
                name.textContent = `${item.firstName} ${item.lastName || ""}`;
                button.appendChild(name);

                // Add title if available
                if (item.title) {
                  const title = document.createElement("span");
                  title.className = "ml-2 text-xs text-muted-foreground";
                  title.textContent = item.title;
                  button.appendChild(title);
                }

                // Add click handler that prevents propagation
                button.addEventListener("mousedown", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  isSelectingMention.current = true;

                  // Use setTimeout to ensure command executes after current event cycle
                  setTimeout(() => {
                    command(item);
                  }, 10);
                });

                // Add mouseenter to update selected index
                button.addEventListener("mouseenter", () => {
                  setSelectedIndex(index);
                  updateSelectedItem();
                });

                container.appendChild(button);
              });

              element.appendChild(container);
            }

            // Helper to clean up
            function cleanup() {
              if (popupRef.current && popupRef.current.parentNode) {
                popupRef.current.parentNode.removeChild(popupRef.current);
              }
              popupRef.current = null;
              setShowMentionSuggestions(false);

              // Delayed reset of selection state to prevent dialog from closing
              setTimeout(() => {
                isSelectingMention.current = false;
              }, 200);
            }
          },

          items: async ({ query }: { query: string }) => {
            return await loadMentionSuggestions(query);
          },

          command: ({
            editor,
            range,
            props,
          }: {
            editor: Editor;
            range: { from: number; to: number };
            props: unknown;
          }) => {
            try {
              isSelectingMention.current = true;
              const user = props as UserDTO;
              const deleteFrom = Math.max(0, range.from - 1);

              // Insert the mention
              editor
                .chain()
                .focus()
                .deleteRange({ from: deleteFrom, to: range.to })
                .insertContent({
                  type: "mention",
                  attrs: {
                    id: user.id ? user.id.toString() : user.email,
                    label: `${user.firstName} ${user.lastName || ""}`.trim(),
                  },
                })
                .insertContent(" ")
                .run();

              // Ensure focus stays in editor and wait before resetting mention state
              setTimeout(() => {
                editor.view.focus();

                // Add a small delay before resetting mention state
                setTimeout(() => {
                  isSelectingMention.current = false;
                }, 100);
              }, 10);

              return true;
            } catch (error) {
              console.error("Error inserting mention:", error);
              isSelectingMention.current = false;
              return false;
            }
          },
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "focus:outline-hidden min-h-[300px] pl-4 pt-2",
      },
      handleDOMEvents: {
        keydown: (view: EditorView, event: KeyboardEvent) => {
          if (event.key === "Escape" && showMentionSuggestions) {
            setShowMentionSuggestions(false);
            return true;
          }
          return false;
        },
        // Prevent mousedown events from closing dialog when in editor
        mousedown: (view: EditorView, event: MouseEvent) => {
          if (inDialog) {
            event.stopPropagation();
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
  });

  // Add global event listener to help with dialog interaction
  useEffect(() => {
    if (!inDialog) return;

    const handleGlobalClick = (e: MouseEvent) => {
      if (isSelectingMention.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    document.addEventListener("mousedown", handleGlobalClick, true);
    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      document.removeEventListener("mousedown", handleGlobalClick, true);
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [inDialog]);

  // Handle blur
  useEffect(() => {
    if (!editor) return;

    const handleBlur = (event: FocusEvent) => {
      // Only trigger onBlur if not selecting a mention
      if (!isSelectingMention.current) {
        onBlur && onBlur();
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener("blur", handleBlur);

    return () => {
      editorDom.removeEventListener("blur", handleBlur);
    };
  }, [editor, onBlur]);

  // Update content when value changes
  useEffect(() => {
    if (
      editor &&
      value !== undefined &&
      value !== null &&
      (isInitialMount.current ||
        editor.getHTML().replace(/\s+/g, "") !== value.replace(/\s+/g, ""))
    ) {
      editor.commands.setContent(value);
      isInitialMount.current = false;
    }
  }, [editor, value]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (popupRef.current && popupRef.current.parentNode) {
        popupRef.current.parentNode.removeChild(popupRef.current);
      }
      popupRef.current = null;
    };
  }, []);

  // Handle adding a link
  const addLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const httpUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `http://${url}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: httpUrl })
      .run();
  };

  // Handle adding a table
  const addTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className="border border-input rounded-md rich-text-editor-container relative"
      ref={editorContainerRef}
      // For dialog context, prevent bubbling
      onMouseDown={inDialog ? (e) => e.stopPropagation() : undefined}
      data-in-dialog={inDialog ? "true" : "false"}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          Bold
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          Italic
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        >
          Strike
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
        >
          Code
        </ToolbarButton>
        <div className="h-6 border-r border-input mx-1"></div>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
        >
          Paragraph
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          Bullet List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          Ordered List
        </ToolbarButton>
        <div className="h-6 border-r border-input mx-1"></div>
        <ToolbarButton onClick={addLink} isActive={editor.isActive("link")}>
          Link
        </ToolbarButton>
        <ToolbarButton onClick={addTable}>Insert Table</ToolbarButton>

        {/* Table operations, only shown when inside a table */}
        {editor.isActive("table") && (
          <div className="flex flex-wrap gap-1 ml-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
            >
              Add Column Before
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              Add Column After
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
            >
              Add Row Before
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              Add Row After
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              Delete Column
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              Delete Row
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              Delete Table
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="bg-background">
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none focus:outline-hidden [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-input [&_.ProseMirror_table_td]:p-2 [&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-input [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:bg-muted"
        />
      </div>
    </div>
  );
};

// Toolbar button component
const ToolbarButton = ({
  onClick,
  isActive,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-2 rounded-md text-sm font-medium
        ${
          isActive
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted text-foreground"
        }
      `}
    >
      {children}
    </button>
  );
};

export default RichTextEditor;
