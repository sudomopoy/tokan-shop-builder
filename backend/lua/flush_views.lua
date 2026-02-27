local result = {}
local keys = redis.call('keys', 'views:article:*')
for i, key in ipairs(keys) do
    local views = tonumber(redis.call('get', key))
    if views and views > 0 then
        local article_id = key:match('views:article:(%d+)')
        table.insert(result, {article_id, views})
        redis.call('set', key, 0)
    end
end
return result