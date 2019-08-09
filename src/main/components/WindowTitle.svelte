<script>
    import Icon from '../components/Icon.svelte'
    const basePath = window.location.href
    window.addEventListener('beforeunload', (event) => {
        // Cancel the event as stated by the standard.
        //event.preventDefault();
        // Chrome requires returnValue to be set.
        //event.returnValue = '';
    });
</script>
<div class="window-title">
    <div class="title">Julie</div>
    <div class="profile">
        <a href="#!/profile">
            <Icon icon="account-outline"></Icon>
        </a>
    </div>
</div>

<style>
    .window-title {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-column-gap: 5px;
        justify-items: center;
        padding: 5px 0 5px;
        color: #737373;
        border-bottom: 1px #d9d0d9 solid;
        position: relative;
        -webkit-app-region: drag;
        text-align: center;
    }
    .title {
        grid-column-start: 2;
    }
    .profile {
        font-size: 20px;
        margin-left: auto;
        margin-right: 15px;
        padding: 0px 15px;
    }
</style>