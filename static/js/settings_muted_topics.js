import $ from "jquery";

import render_muted_topic_ui_row from "../templates/muted_topic_ui_row.hbs";

import * as ListWidget from "./list_widget";
import * as muting from "./muting";
import * as muting_ui from "./muting_ui";
import * as ui from "./ui";

export let loaded = false;

export function populate_list() {
    const muted_topics = muting.get_muted_topics();
    const muted_topics_table = $("#muted_topics_table");
    const $search_input = $("#muted_topics_search");

    ListWidget.create(muted_topics_table, muted_topics, {
        name: "muted-topics-list",
        modifier(muted_topics) {
            return render_muted_topic_ui_row({muted_topics});
        },
        filter: {
            element: $search_input,
            predicate(item, value) {
                return item.topic.toLocaleLowerCase().includes(value);
            },
            onupdate() {
                ui.reset_scrollbar(muted_topics_table.closest(".progressive-table-wrapper"));
            },
        },
        parent_container: $("#muted-topic-settings"),
        simplebar_container: $("#muted-topic-settings .progressive-table-wrapper"),
    });
}

export function set_up() {
    loaded = true;
    $("body").on("click", ".settings-unmute-topic", function (e) {
        const $row = $(this).closest("tr");
        const stream_id = Number.parseInt($row.attr("data-stream-id"), 10);
        const topic = $row.attr("data-topic");

        e.stopPropagation();

        muting_ui.unmute_topic(stream_id, topic);
    });

    populate_list();
}

export function reset() {
    loaded = false;
}
