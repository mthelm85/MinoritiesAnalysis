Reveal.on('ready', async () => {
    const path = d3.geoPath()
    const format = d3.format(",.0f")
    const mapColor = "#7a5cff"
    const us = await d3.json('assets/counties-albers-10m.json', json => json)
    const features = new Map(topojson.feature(us, us.objects.counties).features.map(d => [d.id, d]))
    const rawData = await d3.csv('assets/counties.csv', csv => csv)
    const data = rawData.map(obj => ({
        id: obj.STATE.padStart(2, '0') + obj.COUNTY.padStart(3, '0'),
        position: features.get(obj.STATE.padStart(2, '0') + obj.COUNTY.padStart(3, '0')) && path.centroid(features.get(obj.STATE.padStart(2, '0') + obj.COUNTY.padStart(3, '0'))),
        title: ` ${obj.CTYNAME}, ${obj.STNAME}`,
        value: parseInt(obj.NON_WHITE)
    }))
    const length = d3.scaleLinear([0, d3.max(data, d => d.value)], [0, 150])
    const spike = (length, width = 7) => `M${-width / 2},0L0,${-length}L${width / 2},0`

    const svg = d3.select('#map')
        .append('svg')
        .attr('width', '975px')
        .attr('height', '610px')

    svg.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("fill", "#b0b0b0")
        .attr("d", path)

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-linejoin", "round")
        .attr("d", path)

    const legend = svg.append("g")
        .attr("fill", "#777")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(length.ticks(6).slice(0).reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(${975 - (i + 1) * 20}, 490)`)

    legend.append("path")
        .attr("fill", mapColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", mapColor)
        .attr("d", d => spike(length(d)))

    legend.append("text")
        .attr("dy", "1.3em")
        .text(length.tickFormat(4, "s"))

    svg.append("g")
        .attr("fill", mapColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", mapColor)
        .selectAll("path")
        .data(data
            .filter(d => d.position)
            .sort((a, b) => d3.ascending(a.position[1], b.position[1])
                || d3.ascending(a.position[0], b.position[0])))
        .join("path")
        .attr("transform", d => `translate(${d.position})`)
        .attr("d", d => spike(length(d.value)))
        .append("title")
        .text(d => `County: ${d.title}
Minorities: ${format(d.value)}`)
})
