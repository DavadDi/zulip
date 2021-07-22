import autosize from "autosize";
import $ from "jquery";

import {$t} from "./i18n";
import * as people from "./people";
import * as user_status from "./user_status";

let full_size_status = false; // true or false

// Some functions to handle the full size status explicitly
export function set_full_size(is_full) {
    full_size_status = is_full;
}

export function is_full_size() {
    return full_size_status;
}

export function autosize_textarea(textarea) {
    // Since this supports both compose and file upload, one must pass
    // in the text area to autosize.
    if (!is_full_size()) {
        autosize.update(textarea);
    }
}

export function smart_insert(textarea, syntax) {
    function is_space(c) {
        return c === " " || c === "\t" || c === "\n";
    }

    const pos = textarea.caret();
    const before_str = textarea.val().slice(0, pos);
    const after_str = textarea.val().slice(pos);

    if (
        pos > 0 &&
        // If there isn't space either at the end of the content
        // before the insert or (unlikely) at the start of the syntax,
        // add one.
        !is_space(before_str.slice(-1)) &&
        !is_space(syntax[0])
    ) {
        syntax = " " + syntax;
    }

    // If there isn't whitespace either at the end of the syntax or the
    // start of the content after the syntax, add one.
    if (
        !(
            (after_str.length > 0 && is_space(after_str[0])) ||
            (syntax.length > 0 && is_space(syntax.slice(-1)))
        )
    ) {
        syntax += " ";
    }

    textarea.trigger("focus");

    // We prefer to use insertText, which supports things like undo better
    // for rich-text editing features like inserting links.  But we fall
    // back to textarea.caret if the browser doesn't support insertText.
    if (!document.execCommand("insertText", false, syntax)) {
        textarea.caret(syntax);
    }

    autosize_textarea(textarea);
}

export function insert_syntax_and_focus(syntax, textarea = $("#compose-textarea")) {
    // Generic helper for inserting syntax into the main compose box
    // where the cursor was and focusing the area.  Mostly a thin
    // wrapper around smart_insert.
    smart_insert(textarea, syntax);
}

export function replace_syntax(old_syntax, new_syntax, textarea = $("#compose-textarea")) {
    // Replaces `old_syntax` with `new_syntax` text in the compose box. Due to
    // the way that JavaScript handles string replacements, if `old_syntax` is
    // a string it will only replace the first instance. If `old_syntax` is
    // a RegExp with a global flag, it will replace all instances.
    textarea.val(
        textarea.val().replace(
            old_syntax,
            () =>
                // We need this anonymous function to avoid JavaScript's
                // replace() function treating `$`s in new_syntax as special syntax.  See
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Description
                // for details.
                new_syntax,
        ),
    );
}

export function compute_placeholder_text(opts) {
    // Computes clear placeholder text for the compose box, depending
    // on what heading values have already been filled out.
    //
    // We return text with the stream and topic name unescaped,
    // because the caller is expected to insert this into the
    // placeholder field in a way that does HTML escaping.
    if (opts.message_type === "stream") {
        if (opts.topic) {
            return $t(
                {defaultMessage: "Message #{stream_name} > {topic_name}"},
                {stream_name: opts.stream, topic_name: opts.topic},
            );
        } else if (opts.stream) {
            return $t({defaultMessage: "Message #{stream_name}"}, {stream_name: opts.stream});
        }
    }

    // For private messages
    if (opts.private_message_recipient) {
        const recipient_list = opts.private_message_recipient.split(",");
        const recipient_names = recipient_list
            .map((recipient) => {
                const user = people.get_by_email(recipient);
                return user.full_name;
            })
            .join(", ");

        if (recipient_list.length === 1) {
            // If it's a single user, display status text if available
            const user = people.get_by_email(recipient_list[0]);
            const status = user_status.get_status_text(user.user_id);
            if (status) {
                return $t(
                    {defaultMessage: "Message {recipient_name} ({recipient_status})"},
                    {recipient_name: recipient_names, recipient_status: status},
                );
            }
        }
        return $t({defaultMessage: "Message {recipient_names}"}, {recipient_names});
    }
    return $t({defaultMessage: "Compose your message here"});
}

export function wrap_text_with_markdown(textarea, prefix, suffix) {
    const range = textarea.range();

    if (!document.execCommand("insertText", false, prefix + range.text + suffix)) {
        textarea.range(range.start, range.end).range(prefix + range.text + suffix);
    }
}

export function make_compose_box_full_size() {
    set_full_size(true);

    // The autosize should be destroyed for the full size compose
    // box else it will interfare and shrink its size accordingly.
    autosize.destroy($("#compose-textarea"));

    $("#compose").addClass("compose-fullscreen");

    $(".collapse_composebox_button").show();
    $(".expand_composebox_button").hide();
    $("#compose-textarea").trigger("focus");
}

export function make_compose_box_original_size() {
    set_full_size(false);

    $("#compose").removeClass("compose-fullscreen");

    // Again initialise the compose textarea as it was destroyed
    // when compose box was made full screen
    autosize($("#compose-textarea"));

    $(".collapse_composebox_button").hide();
    $(".expand_composebox_button").show();
    $("#compose-textarea").trigger("focus");
}
