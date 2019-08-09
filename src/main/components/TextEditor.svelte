<script>
    import EditorJS from '@editorjs/editorjs'
    import Code from '@editorjs/code'
    import Header from '@editorjs/header'
    import Image from '@editorjs/image'
    import List from '@editorjs/list'
    import Link from '@editorjs/link'
    import Paragraph from '@editorjs/paragraph'
    import Quote from '@editorjs/quote'
    import Table from '@editorjs/table'
    
    export let content = {}
    export let height
    export let onsave = ()=>{}
    

    var editor = new EditorJS({
        holder : 'editorjs',
        tools: {
            header: {
                class: Header,
                shortcut: 'CMD+SHIFT+H'
            },
            list: {
                class: List,
                shortcut: 'CMD+SHIFT+L'
            },
            paragraph: Paragraph,
            image: Image,
            code: Code,
            table: Table,
            quote: Quote,
        },
        data: content,
        onChange: () => {
            editor.save()
            .then((savedData) => {
                content = savedData
                onsave(savedData)
            });
        }
    });

    onsave(content)
    $: content
</script>

<div id="editorjs" style="min-height: {height? height:''}px;"></div>

<style>
    :global(.ce-settings__button--focused) {
        background-color: #e3eaff !important;
        color: #4c9cff !important;
    }

    :global(.ce-settings__button--confirm) {
        background-color: #ffdad3 !important;
        color: #ff0c0c !important;
    }
</style>